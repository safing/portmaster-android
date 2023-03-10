// RecordMeta describes the meta-data object that is part of
// every API resource.
export interface RecordMeta {
    // Created hold a unix-epoch timestamp when the record has been
    // created.
    Created: number;
    // Deleted hold a unix-epoch timestamp when the record has been
    // deleted.
    Deleted: number;
    // Expires hold a unix-epoch timestamp when the record has been
    // expires.
    Expires: number;
    // Modified hold a unix-epoch timestamp when the record has been
    // modified last.
    Modified: number;
    // Key holds the database record key.
    Key: string;
}
  
// Record describes the base record structure of all API resources.
export interface Record {
    _meta?: RecordMeta;
}
  
export interface SPNStatus extends Record {
    Status: 'failed' | 'disabled' | 'connecting' | 'connected';
    HomeHubID: string;
    ConnectedIP: string;
    ConnectedTransport: string;
    ConnectedSince: string | null;
}
  
class Device  {
    name: string
    id: string 
}
class Subscription {
    ends_at: string
    state: string
}
class Plan {
    name: string
    amount: number
    months: number
    renewable: boolean
    feature_ids?: string[]
}

class View {
    Message?: string;
    ShowAccountData?: boolean;
    ShowAccountButton?: boolean;
    ShowLoginButton?: boolean;
    ShowRefreshButton?: boolean;
    ShowLogoutButton?: boolean;
}

export class User {
    username: string;
    state: string;
    balance: number;
    device: Device | null;
    subscription: Subscription | null;
    current_plan: Plan | null;
    next_plan: Plan | null;
    view: View | null;
    LastNotifiedOfEnd?: string;
    LoggedInAt?: string;

    canUseSPN?: boolean;
}

export class UpdateState {
    State: "up-to-date" | "new-update" | "downloading";
    Resources: string[] | null; 
    FinishedUpTo: number | null;
    DeviceIsOnWifi: boolean;
    OnNotMeteredConnection: boolean;
}