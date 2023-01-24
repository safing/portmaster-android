package engine

import (
	"encoding/json"
	"fmt"

	"github.com/safing/portbase/config"
	"github.com/safing/portbase/database/query"
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

func UIInit() {
	sub, err := dbInterface.Subscribe(query.New("runtime:spn/status"))
	if err != nil {
		fmt.Printf("failed to subscribe to spn status: %s", err)
		return
	}
	go func() {
		for {
			<-sub.Feed
			_ = app_interface.SendUIWindowEvent("SPN", `{"StatusChange": true}`)
		}
	}()
}

func EnableSPN(call PluginCall) {
	_ = app_interface.ToggleTunnel(true)
	err := config.SetConfigOption("spn/enable", true)
	if err != nil {
		log.Errorf("portmaster/android: failed to enable SPN: %s", err)
	}
}

func DisableSPN(call PluginCall) {
	_ = app_interface.ToggleTunnel(false)
	err := config.SetConfigOption("spn/enable", false)
	if err != nil {
		log.Errorf("portmaster/android: failed to disable SPN: %s", err)
	}
}

func GetTunnelState(call PluginCall) {
	call.ResolveJson(fmt.Sprintf(`{"active": %t}`, tunnel.IsActive()))
}

func GetUser(call PluginCall) {
	UIInit()
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
	log.Infof("portmaster/android: exporting debug info")
	debugInfo, err := logs.GetDebugInfo("github")
	if err != nil {
		return
	}
	_ = app_interface.ExportDebugInfo("PortmasterDebugInfo.txt", debugInfo)
}
