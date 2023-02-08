package app_interface

import (
	"fmt"

	"github.com/fxamacker/cbor/v2"
)

var activityFunctions *AppFunctions = nil

func SetActivityFunctions(appInterface AppInterface) {
	activityFunctions = &AppFunctions{javaInterface: appInterface}
}

func HasActivityFunctions() bool {
	return activityFunctions != nil
}

func RemoveActivityFunctionReference() {
	activityFunctions = nil
}

func ExportDebugInfo(filename string, content []byte) error {
	var args = struct {
		Filename string
		Content  []byte
	}{Filename: filename, Content: content}

	argsBytes, err := cbor.Marshal(args)
	if err != nil {
		return err
	}

	_, err = activityFunctions.call("ExportDebugInfo", argsBytes)
	if err != nil {
		return err
	}
	return nil
}

func ToggleTunnel(command string) error {
	args, _ := cbor.Marshal(command)

	_, err := activityFunctions.call("ToggleTunnel", args)
	if err != nil {
		return fmt.Errorf("failed to toggle tunnel: %s", err)
	}

	return nil
}

func SendUIEvent(event Event) error {
	args, _ := cbor.Marshal(event)

	_, err := activityFunctions.call("SendUIEvent", args)
	if err != nil {
		return err
	}
	return nil
}

func SendUIWindowEvent(name, data string) error {
	return SendUIEvent(Event{Name: name, Target: "window", Data: data})
}
