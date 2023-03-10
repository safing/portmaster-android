package app_interface

import (
	"fmt"

	"github.com/fxamacker/cbor/v2"
)

var serviceFunctions *AppFunctions = nil

func SetServiceFunctions(appInterface AppInterface) {
	serviceFunctions = &AppFunctions{javaInterface: appInterface}
}

func HasServiceFunctions() bool {
	return serviceFunctions != nil
}

func RemoveServiceFunctionReference() {
	serviceFunctions = nil
}

func SetDefaultInterfaceForSocket(socketID uintptr) error {
	if serviceFunctions == nil {
		return fmt.Errorf("service not initialized")
	}

	args, _ := cbor.Marshal(int(socketID))

	_, err := serviceFunctions.call("IgnoreSocket", args)
	if err != nil {
		return err
	}
	return nil
}

func GetConnectionOwner(connection Connection) (int, error) {
	if serviceFunctions == nil {
		return 0, fmt.Errorf("service not initialized")
	}

	args, _ := cbor.Marshal(connection)

	data, err := serviceFunctions.call("GetConnectionOwner", args)
	if err != nil {
		return 0, err
	}
	var uid int
	err = cbor.Unmarshal(data, &uid)
	if err != nil {
		return 0, err
	}

	return uid, nil
}

func VPNInit() (int, error) {
	if serviceFunctions == nil {
		return 0, fmt.Errorf("service not initialized")
	}

	data, err := serviceFunctions.call("VPNInit", nil)
	if err != nil {
		return 0, err
	}
	var fd int
	err = cbor.Unmarshal(data, &fd)
	if err != nil {
		return 0, err
	}

	return fd, nil
}

func GetAppUID() (int, error) {
	if serviceFunctions == nil {
		return 0, fmt.Errorf("service not initialized")
	}

	data, err := serviceFunctions.call("GetAppUID", nil)
	if err != nil {
		return 0, err
	}
	var uid int
	err = cbor.Unmarshal(data, &uid)
	if err != nil {
		return 0, err
	}

	return uid, nil
}
