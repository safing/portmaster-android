#/bin/sh

go generate
cd ../android && ./gradlew app:generateUIBridgeCode
