package app_interface

import (
	"fmt"

	"github.com/fxamacker/cbor/v2"
)

// type Functions interface {
// 	GetNetworkInterfaces() ([]NetworkInterface, error)
// 	GetNetworkAddresses() ([]NetworkAddress, error)
// 	GetAppDataDir() (string, error)
// 	OpenSaveAsDialog()
// 	GetPlatformInfo()
// }

type AppInterface interface {
	CallFunction(string, []byte) []byte
}

type AppFunctions struct {
	javaInterface AppInterface
}

type Result struct {
	Data  []byte
	Error string
}

var appFunctions AppFunctions

func Init(appInterface AppInterface) {
	appFunctions = AppFunctions{javaInterface: appInterface}
}

func (s *AppFunctions) call(functionName string, args []byte) ([]byte, error) {
	resultBytes := s.javaInterface.CallFunction(functionName, args)
	if resultBytes == nil {
		return nil, fmt.Errorf("java returned nil result")
	}
	var result Result
	err := cbor.Unmarshal(resultBytes, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to parse result from java: %s", err)
	}
	err = nil
	if result.Error != "" {
		err = fmt.Errorf("%s", result.Error)
	}
	return result.Data, err
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
		return nil, fmt.Errorf("failed to get platform info: %s", err)
	}
	err = cbor.Unmarshal(bytes, info)
	if err != nil {
		return nil, fmt.Errorf("failed to parse cbor: %s", err)
	}

	return info, nil
}
