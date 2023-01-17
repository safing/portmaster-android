package tunnel

import (
	"encoding/json"
	"fmt"

	"github.com/safing/portbase/log"
	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster-android/go/tunnel/logs"
	"github.com/safing/spn/access"
)

type PluginCall interface {
	Resolve()
	ResolveJson(obj string)
	GetArgs() string
	GetInt(name string) int32
	GetLong(name string) int64
	GetFloat(name string) float32
	GetString(name string) string
	GetBool(name string) bool
}

// Functions that have PluginCall as an argument are automatically exposed to the ionic UI

// WaitForStateChange resolves the plugin call when tunnel state is changed
func WaitForStateChange(call PluginCall) {
	go func() {
		newState := <-stateChannel
		call.ResolveJson(fmt.Sprintf(`{"active": %t}`, newState))
	}()
}

func GetState(call PluginCall) {
	call.ResolveJson(fmt.Sprintf(`{"active": %t}`, IsActive()))
}

func GetUser(call PluginCall) {
	user, err := access.GetUser()
	if err != nil {
		call.ResolveJson(fmt.Sprintf(`{"loggedIn": false, "error": %q}`, err))
	} else {
		call.ResolveJson(fmt.Sprintf(`{"loggedIn": true, "username": "%s", "status": "%s", "canUseSPN": %t}`,
			user.Username,
			user.State,
			user.MayUseTheSPN(),
		))
	}
}

func Login(call PluginCall) {
	username := call.GetString("username")
	password := call.GetString("password")
	go func() {
		user, code, err := access.Login(username, password)

		if code != 200 {
			call.ResolveJson(fmt.Sprintf(`{"loggedIn": false, "error": %q}`, err))
		} else {
			call.ResolveJson(fmt.Sprintf(`{"loggedIn": true, "username": %q, "status": %q, "canUseSPN": %t, "error": %q}`,
				user.Username,
				user.State,
				user.MayUseTheSPN(),
				err,
			))
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
}

func GetLogs(call PluginCall) {
	go func() {
		ID := call.GetLong("ID")
		logs, _ := json.Marshal(logs.GetAllLogsAfterID(uint64(ID)))
		call.ResolveJson(fmt.Sprintf(`{"logs": %s}`, string(logs)))
	}()
}

func GetDebugInfoFile(call PluginCall) {
	log.Infof("portmaster/android: exporting debug info")
	debugInfo, err := logs.GetDebugInfo("github")
	if err != nil {
		return
	}
	_ = app_interface.ExportDebugInfo("PortmasterDebugInfo.txt", debugInfo)
}
