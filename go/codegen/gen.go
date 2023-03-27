package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"regexp"
	"strings"
)

const functionsFile = "../engine/ui/functions.go"

type Val struct {
	Name string
	Type string
}

type Func struct {
	Name        string
	Params      []Val
	ReturnTypes []string
	CreateProxy bool
	TSTypes     []string
}

func hasPluginCallParam(f *ast.FuncDecl) bool {
	if f == nil || f.Type == nil {
		return false
	}

	// Check if the function has exactly one parameter
	if f.Type.Params == nil || len(f.Type.Params.List) != 1 {
		return false
	}

	// Check if the type of the first (and only) parameter is PluginCall
	return fmt.Sprintf("%s", f.Type.Params.List[0].Type) == "PluginCall"
}

func getNoErrorTypes(types []string) []string {
	var noErrorTypes []string
	for _, t := range types {
		if t != "error" {
			noErrorTypes = append(noErrorTypes, t)
		}
	}
	return noErrorTypes
}

var parseTSTypesRegex = regexp.MustCompile("ts:(.*)").FindString

func parseTSTypes(comments []*ast.Comment) []string {
	for _, c := range comments {
		typesString := parseTSTypesRegex(c.Text)
		typesString, _ = strings.CutPrefix(typesString, "ts:(")
		typesString, _ = strings.CutSuffix(typesString, ")")
		typesString = strings.ReplaceAll(typesString, " ", "")
		return strings.Split(typesString, ",")
	}
	return nil
}

func main() {
	set := token.NewFileSet()
	parsedFile, err := parser.ParseFile(set, functionsFile, nil, parser.ParseComments)
	if err != nil {
		fmt.Println("Failed to parse package:", err)
		os.Exit(1)
	}

	funcs := []*ast.FuncDecl{}

	for _, d := range parsedFile.Decls {
		if fn, isFn := d.(*ast.FuncDecl); isFn {
			funcs = append(funcs, fn)
		}
	}

	var functions []Func
	for _, f := range funcs {
		structFunc := Func{
			Name:        f.Name.Name,
			CreateProxy: !hasPluginCallParam(f),
		}

		for _, p := range f.Type.Params.List {
			for _, name := range p.Names {
				structFunc.Params = append(structFunc.Params, Val{
					Name: name.Name,
					Type: fmt.Sprintf("%s", p.Type),
				})
			}
		}
		if f.Doc != nil {
			structFunc.TSTypes = parseTSTypes(f.Doc.List)
		}

		if f.Type.Results != nil {
			for _, r := range f.Type.Results.List {
				structFunc.ReturnTypes = append(structFunc.ReturnTypes, fmt.Sprintf("%s", r.Type))
			}
		}

		functions = append(functions, structFunc)
	}

	writeToGoFile("../engine/ui/exported/proxy.go", functions)
	writeToJavaFile("../../android/portmaster/src/main/java/io/safing/portmaster/android/ui/GoBridge.java", functions)
	writeToTSFile("../../src/app/plugins/go.bridge.ts", functions)
}
