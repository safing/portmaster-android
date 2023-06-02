import { Record } from "../lib/portapi.types";

export enum State {
	Ready       = "ready",       // Default idle state.
	Checking    = "checking",    // Downloading indexes.
	Downloading = "downloading", // Downloading updates.
	Fetching    = "fetching",    // Fetching a single file.
}

export interface StateDownloadingDetails {
	// Resources holds the resource IDs that are being downloaded.
	Resources: string[],

	// FinishedUpTo holds the index of Resources that is currently being
	// downloaded. Previous resources have finished downloading.
	FinishedUpTo: number
}

export interface UpdateState {
	// LastCheckAt holds the time of the last update check.
	LastCheckAt: string,
	// LastCheckError holds the error of the last check.
	LastCheckError: string,
	// PendingDownload holds the resources that are pending download.
	PendingDownload: string[],

	// LastDownloadAt holds the time when resources were downloaded the last time.
	LastDownloadAt: string,
	// LastDownloadError holds the error of the last download.
	LastDownloadError: string,
	// LastDownload holds the resources that we downloaded the last time updates
	// were downloaded.
	LastDownload: string[],

	// LastSuccessAt holds the time of the last successful update (check).
	LastSuccessAt: string
}

export interface RegistryState extends Record {
  ID: State | null,
  Details: StateDownloadingDetails | null,
  Updates: UpdateState | null,
}
