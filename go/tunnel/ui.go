package tunnel

import (
	"fmt"

	"github.com/safing/spn/access"
)

type PluginCall interface {
	Resolve()
	ResolveJson(obj string)
	GetArgs() string
	GetInt(name string) int32
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
