package app_interface

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
