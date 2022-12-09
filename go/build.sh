#/bin/sh
set -e
echo Building android library...
go generate
echo Building succesiful
echo Generating binding...
cd codegen
go run gen.go "../../android/app/src/main/java/io/safing/portmaster/android/ui/GoBridge.java"
