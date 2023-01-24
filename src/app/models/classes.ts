class Device  {
    name?: string
    id?: string 
}
class Subscription {
    ends_at: string
    state: string
}
class Plan {
    name?: string
    amount?: number
    months?: number
    renewable?: boolean
    feature_ids?: string[]
}
class View {
    Message?: string
    ShowAccountData?: boolean
    ShowAccountButton?: boolean
    ShowLoginButton?: boolean
    ShowRefreshButton?: boolean
    ShowLogoutButton?: boolean
}

export class User {
    username?: string
    state?: string
    balance?: number
    device?: Device
    subscription?: Subscription
    current_plan?: Plan
    next_plan?: Plan
    view?: View
    LastNotifiedOfEnd?: string
    LoggedInAt?: string
    error?: string

    canUseSPN?: boolean
}

export class Credentials {
    username: string
    password: string
}

export class SPNStatus {
    Status?:             string
    HomeHubID?:          string
    HomeHubName?:        string
    ConnectedIP?:        string
    ConnectedTransport?: string
    ConnectedSince?:     string
}