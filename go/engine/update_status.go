package engine

import (
	"encoding/json"
	"math/rand"
	"sync"

	"github.com/safing/portmaster-android/go/app_interface"
)

const (
	stateUpToDate      = "up-to-date"
	statePendingUpdate = "pending-update"
	stateDownloading   = "downloading"
)

type UpdateState struct {
	State              string
	Resources          []string
	FinishedUpTo       int
	WaitingForWifi     bool
	DeviceIsOnWifi     bool
	ApkUpdateAvailable bool
	ApkDownloadLink    string

	lock       sync.RWMutex
	notifyCall PluginCall
	eventID    string
}

func NewUpdateState() UpdateState {
	return UpdateState{
		State:          stateUpToDate,
		Resources:      nil,
		FinishedUpTo:   0,
		WaitingForWifi: false,
		DeviceIsOnWifi: false,
		notifyCall:     nil,
		eventID:        "",
	}
}

func (u *UpdateState) SetPendingUpdateState(resources []string) {
	u.lock.Lock()
	defer u.lock.Unlock()
	if u.State == stateUpToDate {
		notification := &app_interface.Notification{
			ID:      rand.Int31(),
			Title:   "GeoIP update available",
			Message: "New GeoIP data is available, click for more details.",
		}
		_ = app_interface.ShowNotification(notification)
	}
	u.State = statePendingUpdate
	u.Resources = resources
	u.notify()
}

func (u *UpdateState) SetDownloadingState(index int) {
	u.lock.Lock()
	defer u.lock.Unlock()
	u.State = stateDownloading
	u.FinishedUpTo = index
	u.notify()
}

func (u *UpdateState) SetUpToDateState(sendNotification bool) {
	u.lock.Lock()
	defer u.lock.Unlock()
	if u.State == stateDownloading && sendNotification {
		notification := &app_interface.Notification{
			ID:      rand.Int31(),
			Title:   "Update downloaded",
			Message: "GeoIP data was successfully downloaded.",
		}
		_ = app_interface.ShowNotification(notification)
	}
	u.State = stateUpToDate
	u.Resources = nil
	u.FinishedUpTo = 0
	u.WaitingForWifi = false
	u.notify()
}

func (u *UpdateState) SetWifiState(connected bool) {
	u.lock.Lock()
	defer u.lock.Unlock()
	u.DeviceIsOnWifi = connected
	u.notify()
}

func (u *UpdateState) DownloadOnWifiConnected() {
	u.lock.Lock()
	defer u.lock.Unlock()
	u.WaitingForWifi = true
	u.notify()
}

func (u *UpdateState) IsWaitingForWifi() bool {
	return u.WaitingForWifi
}

func (u *UpdateState) SetUiSubscription(eventID string, call PluginCall) {
	u.lock.Lock()
	defer u.lock.Unlock()
	// Prepare all subscription for removal.
	if u.notifyCall != nil {
		u.notifyCall.KeepAlive(false)
	}

	// Prepare new subscription for use.
	u.notifyCall = call
	u.eventID = eventID
	if call != nil {
		call.KeepAlive(true)
		// Send current state
		u.notify()
	}
}

func (u *UpdateState) SetApkUpdateState(newUpdate bool, link string) {
	u.lock.Lock()
	defer u.lock.Unlock()
	u.ApkUpdateAvailable = newUpdate
	u.ApkDownloadLink = link
	u.notify()
}

func (u *UpdateState) notify() {
	if u.notifyCall != nil {
		stateJson, _ := json.Marshal(u)
		// Send notify event to UI
		u.notifyCall.Notify(u.eventID, string(stateJson))
	}
}
