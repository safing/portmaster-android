package tunnel

import (
	"encoding/json"

	"github.com/safing/portbase/config"
	"github.com/safing/portbase/log"
	"github.com/safing/portmaster-android/go/app_interface"
)

var state *TunnelState = &TunnelState{Status: "disabled"}

func OnTunnelConnected(fd int) {
	state = &TunnelState{}
	err := enableTunnel(fd)
	if err == nil {
		state.Status = "connected"
	} else {
		state.Status = "failed"
		state.Error = err.Error()
	}
	sendState(state)

	// Make sure spn is enabled.
	err = config.SetConfigOption("spn/enable", true)
	if err != nil {
		log.Errorf("tunnel: failed to enable SPN: %s", err)
	}
}

func OnTunnelDisconnected() {
	state = &TunnelState{}
	disableTunnel()
	state.Status = "disabled"
	sendState(state)
}

func StartConnecting() {
	state = &TunnelState{}
	state.Status = "connecting"
	sendState(state)
}

func StartDisconnecting() {
	state = &TunnelState{}
	state.Status = "disconnecting"
	sendState(state)
}

func sendState(state *TunnelState) {
	bytes, _ := json.Marshal(state)
	_ = app_interface.SendUIWindowEvent("tunnel", string(bytes))
}

func GetState() *TunnelState {
	return state
}
