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
      "KeepAlive": "false"
    }
  }
};

export default config;
