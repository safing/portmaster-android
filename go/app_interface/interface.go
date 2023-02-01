package app_interface

type AppInterface interface {
	CallFunction(string, []byte) ([]byte, error)
}

type AppFunctions struct {
	javaInterface AppInterface
}

func (s *AppFunctions) call(functionName string, args []byte) ([]byte, error) {
	resultBytes, err := s.javaInterface.CallFunction(functionName, args)
	if err != nil {
		return nil, err
	}
	return resultBytes, nil
}
