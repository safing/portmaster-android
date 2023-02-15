package engine

import (
	"context"
	"fmt"
	"math/rand"

	"github.com/safing/portbase/api"
	"github.com/safing/portbase/database"
	"github.com/safing/portbase/database/query"
	"github.com/safing/portbase/database/record"
	"github.com/safing/portbase/modules"
	"github.com/safing/portmaster-android/go/app_interface"
)

type SubscribeRequest struct {
	eventName string
	query     string
	call      PluginCall
}

var (
	module      *modules.Module
	dbInterface *database.Interface

	activeNotifications map[string]*app_interface.Notification
	activeSubscriptions map[string]chan struct{}
)

const eventPrefix = "ui-event-"

func init() {
	activeNotifications = make(map[string]*app_interface.Notification)
	activeSubscriptions = make(map[string]chan struct{})

	module = modules.Register("android-engine", nil, start, nil, "base", "notifications")
	module.Enable()
}

func start() error {
	// Get database interface.
	dbInterface = database.NewInterface(nil)
	notificationListener()
	return nil
}

func notificationListener() {
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

	var notification *app_interface.Notification
	if notify, ok := activeNotifications[rec.Key()]; ok {
		notification = notify
	} else {
		notification = &app_interface.Notification{
			ID: rand.Int31(),
		}
		activeNotifications[rec.Key()] = notification
	}

	accessor := rec.GetAccessor(rec)
	notification.Title, _ = accessor.GetString("Title")
	notification.Message, _ = accessor.GetString("Message")

	_ = app_interface.ShowNotification(notification)
}

func UISubscribeRequest(req *SubscribeRequest) {
	serviceID := fmt.Sprintf("%s%s", eventPrefix, req.eventName)

	module.StartServiceWorker(serviceID, 0, func(ctx context.Context) error {
		// Wait for module to be initialized.
		if !module.Online() {
			<-module.StartCompleted()
		}

		// Create a cancel channel.
		cancelChannel := make(chan struct{})
		activeSubscriptions[serviceID] = cancelChannel

		// Query current state.
		query := query.New(req.query)
		iter, err := dbInterface.Query(query)
		if err != nil {
			req.call.Error(fmt.Sprintf("failed to query: %s", err))
			return err
		}
		defer iter.Cancel()

		// Subscribe to the event.
		sub, err := dbInterface.Subscribe(query)
		if err != nil {
			req.call.Error(fmt.Sprintf("failed to subscribe: %s", err))
			return err
		}
		defer func() { _ = sub.Cancel() }()

		// Make sure PluginCall is not delete, while the subscription is active.
		req.call.KeepAlive(true)
		defer req.call.KeepAlive(false)

		// Resolve the UI function, with no error.
		req.call.Resolve()

		// Send current state.
		for rec := range iter.Next {
			jsonData, _ := api.MarshalRecord(rec, false)
			req.call.Notify(req.eventName, string(jsonData))
		}

		// Listen for new events.
		for {
			select {
			case rec, ok := <-sub.Feed:
				if ok {
					jsonData, _ := api.MarshalRecord(rec, false)
					req.call.Notify(req.eventName, string(jsonData))
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
	for _, cancel := range activeSubscriptions {
		cancel <- struct{}{}
	}

	activeSubscriptions = make(map[string]chan struct{})
}
