import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.safing.portmaster.android',
  appName: 'portmaster-android',
  webDir: 'www',
  bundledWebRuntime: false,
  loggingBehavior: 'none',
  // server: {
  //   url: "http://192.168.88.11:8100",
  //   cleartext: true
  // },
  cordova: {
    preferences: {
      "KeepAlive": "false" // Determines whether the application stays running in the background even after a pause event fires. Setting this to false does not kill the app after a pause event, but simply halts execution of code within the cordova webview while the app is in the background. (https://cordova.apache.org/docs/en/latest/config_ref/)
    }
  }
};

export default config;
