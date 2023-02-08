package engine

import (
	"encoding/json"
	"fmt"

	"github.com/safing/portbase/config"
	"github.com/safing/portbase/log"
	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster-android/go/engine/logs"
	"github.com/safing/portmaster-android/go/engine/tunnel"
	"github.com/safing/spn/access"
	"github.com/safing/spn/captain"
)

type PluginCall interface {
	Resolve()
	ResolveJson(obj string)
	GetArgs() string
	GetInt(name string) (int32, error)
	GetLong(name string) (int64, error)
	GetFloat(name string) (float32, error)
	GetString(name string) (string, error)
	GetBool(name string) (bool, error)
}

// Functions that have PluginCall as an argument are automatically exposed to the ionic UI

func EnableSPN(call PluginCall) {
	err := config.SetConfigOption("spn/enable", true)
	if err != nil {
		log.Errorf("portmaster/android: failed to enable SPN: %s", err)
	}
	call.Resolve()
}

func DisableSPN(call PluginCall) {
	err := config.SetConfigOption("spn/enable", false)
	if err != nil {
		log.Errorf("portmaster/android: failed to disable SPN: %s", err)
	}
	call.Resolve()
}

func EnableTunnel(call PluginCall) {
	if !tunnel.IsActive() {
		tunnel.StartConnecting()
		_ = app_interface.ToggleTunnel(true)
	}
	call.Resolve()
}

func DisableTunnel(call PluginCall) {
	if tunnel.IsActive() {
		tunnel.StartDisconnecting()
		_ = app_interface.ToggleTunnel(false)
	}
	call.Resolve()
}

func GetTunnelStatus(call PluginCall) {
	state := tunnel.GetState()
	bytes, _ := json.Marshal(state)
	call.ResolveJson(string(bytes))
}

func GetUser(call PluginCall) {
	user, err := access.GetUser()
	if err != nil {
		// Just log and return empty response. No info needed for the user.
		log.Warningf("portmaster/android: failed to get user from database: %s", err)
		call.ResolveJson("")
	} else {
		userJson, _ := json.Marshal(user)
		log.Info(string(userJson))
		call.ResolveJson(string(userJson))
	}
}

func Login(call PluginCall) {
	// Get credentials from plugin call.
	username, err := call.GetString("username")
	if err != nil {
		call.ResolveJson(`{"error": "username can't be empty"}`)
		return
	}
	password, err := call.GetString("password")
	if err != nil {
		call.ResolveJson(`{"error": "password can't be empty"}`)
		return
	}

	// Keep the request async. This will not affect the ui call.
	go func() {
		user, code, err := access.Login(username, password)
		if code != 200 {
			// Failed to login. Return the error.
			call.ResolveJson(fmt.Sprintf(`{"error": %q}`, err))
		} else {
			// Login successful
			userJson, _ := json.Marshal(user)
			log.Info(string(userJson))
			call.ResolveJson(string(userJson))

		}
	}()
}

func Logout(call PluginCall) {
	err := access.Logout(false, true)
	if err != nil {
		call.ResolveJson(fmt.Sprintf(`"error": %s`, err))
	} else {
		call.Resolve()
	}

	// database.NewInterface()
}

func UpdateUserInfo(call PluginCall) {
	user, code, err := access.UpdateUser()
	if code != 200 {
		// Failed to login. Return the error.
		call.ResolveJson(fmt.Sprintf(`{"error": %q}`, err))
	} else {
		// Login successful
		userJson, _ := json.Marshal(user)
		log.Info(string(userJson))
		call.ResolveJson(string(userJson))
	}
}

func GetSPNStatus(call PluginCall) {
	status := captain.GetSPNStatus()
	statusJson, err := json.Marshal(status)
	if err != nil {
		log.Errorf("portmaster/android: failed to get SPN status: %s", err)
		return
	}
	call.ResolveJson(string(statusJson))
}

func GetLogs(call PluginCall) {
	ID, _ := call.GetLong("ID")
	logs, _ := json.Marshal(logs.GetAllLogsAfterID(uint64(ID)))
	call.ResolveJson(fmt.Sprintf(`{"logs": %s}`, string(logs)))
}

func GetDebugInfoFile(call PluginCall) {
	defer call.Resolve()
	log.Infof("portmaster/android: exporting debug info")
	debugInfo, err := logs.GetDebugInfo("github")
	if err != nil {
		return
	}
	_ = app_interface.ExportDebugInfo("PortmasterDebugInfo.txt", debugInfo)
}

func DatabaseSubscribe(call PluginCall) {
	eventName, err := call.GetString("Name")
	if err != nil {
		call.ResolveJson(`{"error": "Missing Name argument"}`)
		return
	}

	query, err := call.GetString("Query")
	if err != nil {
		call.ResolveJson(`{"error": "Missing Query argument"}`)
		return
	}

	req := &SubscribeRequest{eventName: eventName, query: query, call: call}
	go func() {
		UISubscribeRequest(req) // this call will resolve the PluginCall
	}()
}