package main

import (
	"bytes"
	"fmt"
	"os"
	"text/template"
)

const typeScriptInterfaceMethodTemplate = `	{{if .CreateProxy}}{{.Name}}({{if .Params}}data: any{{end}}): Promise<{{if has_non_error_returns .ReturnTypes}}any{{else}}void{{end}}>{{else}}{{.Name}}(any): Promise<any>{{end}}
`

const typeScriptClassMethodTemplate = `{{if .CreateProxy}}
	public {{.Name}}({{ts_params .}}): Promise<{{to_return_types .}}> {
		{{if isVoidFunction .}}return GoInterface.{{.Name}}({{ts_param_names .}});{{else}}return new Promise<{{to_return_types .}}>((resolve, reject) => {
            GoInterface.{{.Name}}({{ts_param_names .}}).then((result) => {
               resolve({{to_return_names "result." .}});
            }, (result) => {
               reject(result);
            });
        });{{end}}
	}
	{{else}}
	public {{.Name}}(param: any): Promise<any> {
		return GoInterface.{{.Name}}(param);
	}
{{end}}`
const typescriptFileTemplate = `
import { Plugin, registerPlugin } from '@capacitor/core';
import { SPNStatus, UserProfile } from '../types/spn.types';

export interface GoBridgeInterface extends Plugin {
%s
}
export const GoInterface = registerPlugin<GoBridgeInterface>("GoBridge")

export class GoBridgeClass {
%s
}

var GoBridge = new GoBridgeClass()
export default GoBridge;
`

func goToTsType(t string) string {
	switch t {
	case "string":
		return "string"
	case "int", "int32", "int64", "float32":
		return "number"
	case "bool":
		return "boolean"
	case "PluginCall":
		return "any"
	default:
		return "any"
	}
}

func toTypeScriptParams(f Func) string {
	result := ""
	for i, p := range f.Params {
		result += p.Name + ": "
		result += goToTsType(p.Type)
		if i < len(f.Params)-1 {
			result += ", "
		}
	}

	return result
}

func toTypeScriptParamNames(f Func) string {
	result := ""

	if len(f.Params) > 0 {
		result += "{"
	}

	for i, p := range f.Params {
		result += fmt.Sprintf("%s: %s", p.Name, p.Name)
		if i < len(f.Params)-1 {
			result += ", "
		}
	}

	if len(f.Params) > 0 {
		result += "}"
	}

	return result
}

func toTypescriptReturnTypes(f Func) string {
	result := ""
	returnTypes := getNoErrorTypes(f.ReturnTypes)

	if len(returnTypes) == 0 {
		return "void"
	}

	if len(returnTypes) > 1 {
		result += "["
	}

	if len(f.TSTypes) > 0 {
		for i, t := range f.TSTypes {
			result += t
			if i < len(f.TSTypes)-1 {
				result += ", "
			}
		}
	} else {
		for i, t := range returnTypes {
			result += goToTsType(t)
			if i < len(returnTypes)-1 {
				result += ", "
			}
		}
	}

	if len(returnTypes) > 1 {
		result += "]"
	}

	return result
}

func getTypescriptReturnNames(prefix string, f Func) string {
	result := ""
	returnTypes := getNoErrorTypes(f.ReturnTypes)

	if len(returnTypes) > 1 {
		result += "["
	}

	for i := range returnTypes {
		result += fmt.Sprintf("%sret%d", prefix, i)

		if i < len(returnTypes)-1 {
			result += ", "
		}
	}

	if len(returnTypes) > 1 {
		result += "]"
	}
	return result
}

func isVoidFunction(function Func) bool {
	returnTypes := getNoErrorTypes(function.ReturnTypes)
	return len(returnTypes) == 0
}

func getClassMethods(functions []Func) string {
	tsTmpl := template.New("TSClassMethodTemplate")
	tsTmpl.Funcs(template.FuncMap{
		"has_non_error_returns": hasNonErrorReturnTypes,
		"ts_params":             toTypeScriptParams,
		"ts_param_names":        toTypeScriptParamNames,
		"to_return_types":       toTypescriptReturnTypes,
		"to_return_names":       getTypescriptReturnNames,
		"isVoidFunction":        isVoidFunction,
	})
	_, err := tsTmpl.Parse(typeScriptClassMethodTemplate)
	if err != nil {
		fmt.Printf("Failed to parse template: %s", err)
		return ""
	}

	buf := new(bytes.Buffer)

	for _, r := range functions {
		tsTmpl.Execute(buf, r)
	}

	return buf.String()
}

func getInterfaceMethods(functions []Func) string {
	tsTmpl := template.New("TSInterfaceMethodTemplate")
	tsTmpl.Funcs(template.FuncMap{
		"has_non_error_returns": hasNonErrorReturnTypes,
		"ts_params":             toTypeScriptParams,
		"ts_param_names":        toTypeScriptParamNames,
		"to_return_types":       toTypescriptReturnTypes,
		"to_return_names":       getTypescriptReturnNames,
	})
	_, err := tsTmpl.Parse(typeScriptInterfaceMethodTemplate)
	if err != nil {
		fmt.Printf("Failed to parse template: %s", err)
		return ""
	}

	buf := new(bytes.Buffer)

	for _, r := range functions {
		tsTmpl.Execute(buf, r)
	}

	return buf.String()
}

func writeToTSFile(filename string, functions []Func) {
	tsFile, err := os.Create(filename)
	if err != nil {
		fmt.Printf("Failed to create file: %s", err)
		return
	}
	defer tsFile.Close()

	_, err = tsFile.WriteString(fmt.Sprintf(typescriptFileTemplate, getInterfaceMethods(functions), getClassMethods(functions)))
	if err != nil {
		fmt.Printf("Failed to write to file: %s", err)
		return
	}
}
