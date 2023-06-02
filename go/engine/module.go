package engine

import (
	"context"
	"fmt"
	"math/rand"
	"sync"

	"github.com/safing/portbase/api"
	"github.com/safing/portbase/config"
	"github.com/safing/portbase/database"
	"github.com/safing/portbase/database/query"
	"github.com/safing/portbase/database/record"
	"github.com/safing/portbase/info"
	"github.com/safing/portbase/log"
	"github.com/safing/portbase/modules"
	"github.com/safing/portbase/updater"
	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster/updates"
	"github.com/tevino/abool"

	semver "github.com/hashicorp/go-version"
)

type PluginCall interface {
	Resolve()
	ResolveJson(obj string)
	Error(err string)
	GetArgs() string
	GetInt(name string) (int32, error)
	GetLong(name string) (int64, error)
	GetFloat(name string) (float32, error)
	GetString(name string) (string, error)
	GetBool(name string) (bool, error)
	Notify(eventName string, data string) error
	KeepAlive(keepAlive bool)
}

type SubscribeRequest struct {
	EventName string
	Query     string
	Call      PluginCall
}

var (
	module      *modules.Module
	dbInterface *database.Interface

	activeNotifications map[string]*app_interface.Notification
	activeSubscriptions sync.Map // [string]chan struct{}

	NewApkVersion abool.AtomicBool
)

const eventPrefix = "ui-event-"

func init() {
	activeNotifications = make(map[string]*app_interface.Notification)
	activeSubscriptions = sync.Map{}

	module = modules.Register("android-engine", nil, start, nil, "base", "status", "notifications", "updates", "netenv")
	module.Enable()
}

func start() error {
	// Switch to the beta channel if it's a beta build.
	platformInfo, err := app_interface.GetPlatformInfo()
	if err != nil {
		log.Errorf("engine: failed to set release level to beta: %s", err)
	}
	if platformInfo.ApplicationID == BetaApplicationID {
		err := config.SetConfigOption("code/releaseLevel", "beta")
		if err != nil {
			log.Errorf("engine: failed to set release level to beta: %s", err)
		}
	}

	// Get database interface.
	dbInterface = database.NewInterface(nil)
	notificationListener()

	return nil
}

func notificationListener() {
	// Listen for notifications from the portmaster core and forward them to the system notifier.
	module.StartServiceWorker("notification-listener", 0, func(ctx context.Context) error {
		query := query.New("notifications:all/")
		iter, err := dbInterface.Query(query)
		if err != nil {
			return err
		}
		sub, err := dbInterface.Subscribe(query)
		if err != nil {
			return err
		}

		for rec := range iter.Next {
			sendNotification(rec)
		}

		for {
			select {
			case rec, ok := <-sub.Feed:
				if ok {
					sendNotification(rec)
				} else {
					return nil
				}
			case <-ctx.Done():
				return nil
			}
		}
	})
}

func sendNotification(rec record.Record) {
	if rec.Meta().Deleted != 0 {
		if notify, ok := activeNotifications[rec.Key()]; ok {
			_ = app_interface.CancelNotification(notify.ID)
		}
		return
	}

	accessor := rec.GetAccessor(rec)
	showOnSystem, _ := accessor.GetBool("ShowOnSystem")
	if !showOnSystem {
		return
	}
	var notification *app_interface.Notification
	if notify, ok := activeNotifications[rec.Key()]; ok {
		notification = notify
	} else {
		notification = &app_interface.Notification{
			ID: rand.Int31(),
		}
		activeNotifications[rec.Key()] = notification
	}

	notification.Title, _ = accessor.GetString("Title")
	notification.Message, _ = accessor.GetString("Message")

	_ = app_interface.ShowNotification(notification)
}

func UISubscribeRequest(req *SubscribeRequest) {
	serviceID := fmt.Sprintf("%s%s", eventPrefix, req.EventName)

	module.StartServiceWorker(serviceID, 0, func(ctx context.Context) error {
		// Wait for module to be initialized.
		if !module.Online() {
			<-module.StartCompleted()
		}

		// Create a cancel channel.
		cancelChannel := make(chan struct{})
		activeSubscriptions.Store(serviceID, cancelChannel)

		// Query current state.
		query := query.New(req.Query)
		iter, err := dbInterface.Query(query)
		if err != nil {
			req.Call.Error(fmt.Sprintf("failed to query: %s", err))
			return err
		}
		defer iter.Cancel()

		// Subscribe to the event.
		sub, err := dbInterface.Subscribe(query)
		if err != nil {
			req.Call.Error(fmt.Sprintf("failed to subscribe: %s", err))
			return err
		}
		defer func() { _ = sub.Cancel() }()

		// Make sure PluginCall is not delete, while the subscription is active.
		req.Call.KeepAlive(true)
		defer req.Call.KeepAlive(false)

		// Resolve the UI function, with no error.
		req.Call.Resolve()

		// Send current state.
		for rec := range iter.Next {
			jsonData, _ := api.MarshalRecord(rec, false)
			req.Call.Notify(req.EventName, string(jsonData))
		}

		// Listen for new events.
		for {
			select {
			case rec, ok := <-sub.Feed:
				if ok {
					jsonData, _ := api.MarshalRecord(rec, false)
					req.Call.Notify(req.EventName, string(jsonData))
				} else {
					return nil
				}
			case <-ctx.Done():
				return nil
			case <-cancelChannel:
				return nil
			}
		}
	})
}

func CancelAllUISubscriptions() {
	activeSubscriptions.Range(func(key any, cancel any) bool {
		cancel.(chan struct{}) <- struct{}{}
		return true
	})

	activeSubscriptions = sync.Map{}
}

func RemoveSubscription(eventID string) {

	if channel, ok := activeSubscriptions.LoadAndDelete(eventID); ok {
		channel.(chan struct{}) <- struct{}{}
	}
}

func DownloadUpdates() {
	// Trigger download
	updates.TriggerUpdate(true)
}

func DownloadUpdatesOnWifiConnected() {
	// Trigger download when wifi is avaliable.
	go func() {
		<-NotifiOnNotMeterdNetwork()
		updates.TriggerUpdate(true)
	}()
}

func checkForNewVersionOfApk() error {
	androidApk, err := updates.GetVersionWithFullID("android_any/app/portmaster-beta.apk")
	if err != nil {
		return err
	}

	// Check for new apk version.
	currentVersion, _ := semver.NewVersion(info.GetInfo().Version)
	NewApkVersion.SetTo(androidApk.SemVer().GreaterThan(currentVersion))

	return nil
}

func IsGeoIPDataAvailable() (bool, error) {
	// Get geoip v4 resource
	geoipv4, err := updates.GetVersion("intel/geoip/geoipv4.mmdb.gz")
	if err != nil {
		return false, err
	}

	// Get geoip v6 resource
	geoipv6, err := updates.GetVersion("intel/geoip/geoipv6.mmdb.gz")
	if err != nil {
		return false, err
	}
	return geoipv4.Available && geoipv6.Available, nil
}
