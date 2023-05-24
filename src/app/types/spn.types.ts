export class UpdateState {
    State: "up-to-date" | "pending-update" | "downloading";
    Resources: string[] | null; 
    FinishedUpTo: number | null;
    WaitingForWifi: boolean;
    DeviceIsOnWifi: boolean;
	ApkUpdateAvailable: boolean;
	ApkDownloadLink:    string;
}