import { Plugin, registerPlugin } from '@capacitor/core';
import { SPNStatus, TunnelStatus, User } from '../types/spn.types';

export interface GoBridgeInterface extends Plugin {
    EnableSPN(): Promise<void>;
    DisableSPN(): Promise<void>;
    EnableTunnel(): Promise<void>;
    DisableTunnel(): Promise<void>;
    RestartTunnel(): Promise<void>;
    GetTunnelStatus(): Promise<TunnelStatus>;
    GetUser(): Promise<User>;
    Login(data: {username: String, password: String}): Promise<User>;
    Logout(): Promise<any>;
    UpdateUserInfo(): Promise<User>;
    GetSPNStatus(): Promise<SPNStatus>;
    GetLogs(data: any): Promise<any>;
    GetDebugInfoFile(): Promise<void>;
    DatabaseSubscribe(data: {name: String, query: String}): Promise<any>;
    CancelAllSubscriptions(): Promise<void>;
    RemoveSubscription(data: {eventID: String}): Promise<void>;
}
const GoBridge = registerPlugin<GoBridgeInterface>("GoBridge")
export default GoBridge;