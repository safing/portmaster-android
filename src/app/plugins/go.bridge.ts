import { Plugin, registerPlugin } from '@capacitor/core';
import { IssueRequest, TicketRequest } from '../types/issue.types';
import { SPNStatus, TunnelStatus, User } from '../types/spn.types';

export interface GoBridgeInterface extends Plugin {
    EnableSPN(): Promise<void>;
    DisableSPN(): Promise<void>;
    EnableTunnel(): Promise<void>;
    DisableTunnel(): Promise<void>;
    RestartTunnel(): Promise<void>;
    GetTunnelStatus(): Promise<TunnelStatus>;
    GetUser(): Promise<User>;
    Login(data: {username: string, password: string}): Promise<User>;
    Logout(): Promise<any>;
    UpdateUserInfo(): Promise<User>;
    GetSPNStatus(): Promise<SPNStatus>;
    GetLogs(data: any): Promise<any>;
    GetDebugInfoFile(): Promise<void>;
    GetDebugInfo(): Promise<any>;
    DatabaseSubscribe(data: {name: string, query: string}): Promise<any>;
    CancelAllSubscriptions(): Promise<void>;
    RemoveSubscription(data: {eventID: string}): Promise<void>;
    CreateIssue(data: {debugInfo: string, genUrl: boolean, issueRequest: string}): Promise<string>;
    CreateTicket(data: {debugInfo: string, ticketRequest: string}): Promise<any>;
}
const GoBridge = registerPlugin<GoBridgeInterface>("GoBridge")
export default GoBridge;