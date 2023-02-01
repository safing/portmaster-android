package engine

import (
	"context"
	"fmt"
	"math/rand"

	"github.com/safing/portbase/api"
	"github.com/safing/portbase/database"
	"github.com/safing/portbase/database/query"
	"github.com/safing/portbase/database/record"
	"github.com/safing/portbase/log"
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
)

func init() {
	activeNotifications = make(map[string]*app_interface.Notification)

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
	module.StartServiceWorker(fmt.Sprintf("ui-event-%s", req.eventName), 0, func(ctx context.Context) error {
		if !module.Online() {
			<-module.StartCompleted()
		}

		query := query.New(req.query)
		iter, err := dbInterface.Query(query)
		if err != nil {
			req.call.ResolveJson(fmt.Sprintf(`{"error": "failed to query: %s"}`, err))
			return err
		}
		defer iter.Cancel()

		sub, err := dbInterface.Subscribe(query)
		if err != nil {
			req.call.ResolveJson(fmt.Sprintf(`{"error": "failed to subscribe: %s"}`, err))
			return err
		}
		defer func() { _ = sub.Cancel() }()

		// Resolve the UI function.
		req.call.Resolve()

		for rec := range iter.Next {
			sendRecord(req.eventName, rec)
		}

		for {
			select {
			case rec, ok := <-sub.Feed:
				if ok {
					sendRecord(req.eventName, rec)
				} else {
					return nil
				}
			case <-ctx.Done():
				return nil
			}

		}
	})
}

func sendRecord(eventName string, rec record.Record) {
	jsonData, _ := api.MarshalRecord(rec, false)
	log.Infof("Event data: %s", string(jsonData))
	_ = app_interface.SendUIWindowEvent(eventName, string(jsonData))
}
