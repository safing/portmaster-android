package engine

import (
	"encoding/json"
	"sync"
)

type UpdateState struct {
	// Possible values: "up-to-data", "pending-update", "downloading"
	State          string
	Resources      []string
	FinishedUpTo   int
	WaitingForWifi bool
	DeviceIsOnWifi bool

	lock       sync.RWMutex
	notifyCall PluginCall
	eventID    string
}

func NewUpdateState() UpdateState {
	return UpdateState{
		State:          "up-to-data",
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
	u.State = "pending-update"
	u.Resources = resources
	u.notify()
}

func (u *UpdateState) SetDownloadingState(index int) {
	u.lock.Lock()
	defer u.lock.Unlock()
	u.State = "downloading"
	u.FinishedUpTo = index
	u.notify()
}

func (u *UpdateState) SetUpToDateState() {
	u.lock.Lock()
	defer u.lock.Unlock()
	u.State = "up-to-date"
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

func (u *UpdateState) notify() {
	if u.notifyCall != nil {
		stateJon, _ := json.Marshal(u)
		// Send notify event to UI
		u.notifyCall.Notify(u.eventID, string(stateJon))
	}
}
