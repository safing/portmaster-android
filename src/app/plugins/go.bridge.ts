
import { Plugin, registerPlugin } from '@capacitor/core';
import { SPNStatus, UserProfile } from '../types/spn.types';

export interface GoBridgeInterface extends Plugin {
	EnableSPN(): Promise<void>
	DisableSPN(): Promise<void>
	IsTunnelActive(): Promise<any>
	EnableTunnel(): Promise<void>
	RestartTunnel(): Promise<void>
	GetUser(): Promise<any>
	Login(any): Promise<any>
	Logout(): Promise<void>
	UpdateUserInfo(): Promise<any>
	GetSPNStatus(): Promise<any>
	GetLogs(data: any): Promise<any>
	GetDebugInfoFile(): Promise<void>
	GetDebugInfo(): Promise<any>
	DatabaseSubscribe(any): Promise<any>
	CancelAllSubscriptions(): Promise<void>
	RemoveSubscription(data: any): Promise<void>
	Shutdown(): Promise<void>
	CreateIssue(data: any): Promise<any>
	CreateTicket(data: any): Promise<void>
	DownloadPendingUpdates(): Promise<void>
	DownloadUpdatesOnWifiConnected(): Promise<void>
	SubscribeToUpdater(any): Promise<any>
	UnsubscribeFromUpdater(): Promise<void>
	IsGeoIPDataAvailable(): Promise<any>

}
export const GoInterface = registerPlugin<GoBridgeInterface>("GoBridge")

export class GoBridgeClass {

	public EnableSPN(): Promise<void> {
		return GoInterface.EnableSPN();
	}
	
	public DisableSPN(): Promise<void> {
		return GoInterface.DisableSPN();
	}
	
	public IsTunnelActive(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
            GoInterface.IsTunnelActive().then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
	public EnableTunnel(): Promise<void> {
		return GoInterface.EnableTunnel();
	}
	
	public RestartTunnel(): Promise<void> {
		return GoInterface.RestartTunnel();
	}
	
	public GetUser(): Promise<UserProfile> {
		return new Promise<UserProfile>((resolve, reject) => {
            GoInterface.GetUser().then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
	public Login(param: any): Promise<any> {
		return GoInterface.Login(param);
	}

	public Logout(): Promise<void> {
		return GoInterface.Logout();
	}
	
	public UpdateUserInfo(): Promise<UserProfile> {
		return new Promise<UserProfile>((resolve, reject) => {
            GoInterface.UpdateUserInfo().then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
	public GetSPNStatus(): Promise<SPNStatus> {
		return new Promise<SPNStatus>((resolve, reject) => {
            GoInterface.GetSPNStatus().then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
	public GetLogs(ID: number): Promise<any> {
		return new Promise<any>((resolve, reject) => {
            GoInterface.GetLogs({ID: ID}).then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
	public GetDebugInfoFile(): Promise<void> {
		return GoInterface.GetDebugInfoFile();
	}
	
	public GetDebugInfo(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
            GoInterface.GetDebugInfo().then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
	public DatabaseSubscribe(param: any): Promise<any> {
		return GoInterface.DatabaseSubscribe(param);
	}

	public CancelAllSubscriptions(): Promise<void> {
		return GoInterface.CancelAllSubscriptions();
	}
	
	public RemoveSubscription(eventID: string): Promise<void> {
		return GoInterface.RemoveSubscription({eventID: eventID});
	}
	
	public Shutdown(): Promise<void> {
		return GoInterface.Shutdown();
	}
	
	public CreateIssue(debugInfo: string, genUrl: boolean, issueRequestStr: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
            GoInterface.CreateIssue({debugInfo: debugInfo, genUrl: genUrl, issueRequestStr: issueRequestStr}).then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
	public CreateTicket(debugInfo: string, ticketRequestStr: string): Promise<void> {
		return GoInterface.CreateTicket({debugInfo: debugInfo, ticketRequestStr: ticketRequestStr});
	}
	
	public DownloadPendingUpdates(): Promise<void> {
		return GoInterface.DownloadPendingUpdates();
	}
	
	public DownloadUpdatesOnWifiConnected(): Promise<void> {
		return GoInterface.DownloadUpdatesOnWifiConnected();
	}
	
	public SubscribeToUpdater(param: any): Promise<any> {
		return GoInterface.SubscribeToUpdater(param);
	}

	public UnsubscribeFromUpdater(): Promise<void> {
		return GoInterface.UnsubscribeFromUpdater();
	}
	
	public IsGeoIPDataAvailable(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
            GoInterface.IsGeoIPDataAvailable().then((result) => {
               resolve(result.ret0);
            }, (result) => {
               reject(result);
            });
        });
	}
	
}

var GoBridge = new GoBridgeClass()
export default GoBridge;
