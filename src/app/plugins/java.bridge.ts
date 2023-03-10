import { registerPlugin } from '@capacitor/core';

export interface JavaBridgeInterface {
    getAppSettings(): Promise<any>; 
    setAppSettings(apps: any): Promise<void>;
    requestVPNPermission(): Promise<void>;
    isVPNPermissionGranted(): Promise<any>;
    requestNotificationsPermission(): Promise<any>;
    isNotificationPermissionGranted(): Promise<any>;
    initEngine(): Promise<void>;
    shouldShowWelcomeScreen(): Promise<any>;
    openUrlInBrowser(data: {url: string}): Promise<void>;
    isWifiEnabled(): Promise<{enabled: boolean}>;

    // Default plugin functions.
    addListener(eventId, listener): Promise<any>;
}
const JavaBridge = registerPlugin<JavaBridgeInterface>("JavaBridge")
export default JavaBridge;