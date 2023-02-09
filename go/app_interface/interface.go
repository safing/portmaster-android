package app_interface

import (
	"fmt"
)

type AppInterface interface {
	CallFunction(string, []byte) ([]byte, error)
}

type AppFunctions struct {
	javaInterface AppInterface
}

func (s *AppFunctions) call(functionName string, args []byte) ([]byte, error) {
	if s == nil {
		return nil, fmt.Errorf("reference was nil")
	}
	return s.javaInterface.CallFunction(functionName, args)
}
