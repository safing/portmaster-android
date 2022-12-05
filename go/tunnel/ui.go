package tunnel

import "fmt"

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
func OnStateChange(call PluginCall) {
	go func() {
		newState := <-stateChannel
		call.ResolveJson(fmt.Sprintf(`{"active": %t}`, newState))
	}()
}

func GetState(call PluginCall) {
	call.ResolveJson(fmt.Sprintf(`{"active": %t}`, IsActive()))
}
