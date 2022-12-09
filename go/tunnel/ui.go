package tunnel

import (
	"fmt"
	"log"

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

// OnStateChange resolves the plugin call when tunnel state is changed
func WaitForStateChange(call PluginCall) {
	go func() {
		newState := <-stateChannel
		call.ResolveJson(fmt.Sprintf(`{"active": %t}`, newState))
	}()
}

func GetState(call PluginCall) {
	call.ResolveJson(fmt.Sprintf(`{"active": %t}`, IsActive()))
}

func Login(call PluginCall) {
	username := call.GetString("username")
	password := call.GetString("password")
	go func() {
		user, code, err := access.Login(username, password)
		if user != nil {
			log.Printf("User: %+v, error: %s, code: %d", user, err, code)
		} else {
			log.Printf("Login code: %d error: %s", code, err)
		}
	}()

	call.Resolve()
}
