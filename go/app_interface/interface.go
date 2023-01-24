package app_interface

import (
	"fmt"

	"github.com/fxamacker/cbor/v2"
)

type AppInterface interface {
	CallFunction(string, []byte) ([]byte, error)
}

type AppFunctions struct {
	javaInterface AppInterface
}

var appFunctions AppFunctions

func Init(appInterface AppInterface) {
	appFunctions = AppFunctions{javaInterface: appInterface}
}

func (s *AppFunctions) call(functionName string, args []byte) ([]byte, error) {
	resultBytes, err := s.javaInterface.CallFunction(functionName, args)
	if err != nil {
		return nil, err
	}
	return resultBytes, nil
}

func GetNetworkInterfaces() ([]NetworkInterface, error) {
	bytes, err := appFunctions.call("GetNetworkInterfaces", nil)
	if err != nil {
		return nil, err
	}
	var interfaces []NetworkInterface
	err = cbor.Unmarshal(bytes, &interfaces)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response from java: %s", err)
	}
	for _, i := range interfaces {
		i.setFlagsValue()
	}
	return interfaces, nil
}

func GetNetworkAddresses() ([]NetworkAddress, error) {
	bytes, err := appFunctions.call("GetNetworkAddresses", nil)
	if err != nil {
		return nil, err
	}
	var addresses []NetworkAddress
	err = cbor.Unmarshal(bytes, &addresses)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response from java: %s", err)
	}
	return addresses, nil
}

func GetAppDataDir() (string, error) {
	bytes, err := appFunctions.call("GetAppDataDir", nil)
	if err != nil {
		return "", err
	}

	return string(bytes), nil
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

	_, err = appFunctions.call("ExportDebugInfo", argsBytes)
	if err != nil {
		return err
	}
	return nil
}

func GetPlatformInfo() (*PlatformInfo, error) {
	info := &PlatformInfo{}

	bytes, err := appFunctions.call("GetPlatformInfo", nil)
	if err != nil {
		return nil, err
	}
	err = cbor.Unmarshal(bytes, info)
	if err != nil {
		return nil, fmt.Errorf("failed to parse cbor: %s", err)
	}

	return info, nil
}

func ToggleTunnel(enable bool) error {
	args, _ := cbor.Marshal(enable)

	_, err := appFunctions.call("ToggleTunnel", args)
	if err != nil {
		return fmt.Errorf("failed to enable tunnel: %s", err)
	}

	return nil
}

func SendUIEvent(event Event) error {
	args, _ := cbor.Marshal(event)

	_, err := appFunctions.call("SendUIEvent", args)
	if err != nil {
		return err
	}
	return nil
}

func SendUIWindowEvent(name, data string) error {
	return SendUIEvent(Event{Name: name, Target: "window", Data: data})
}
