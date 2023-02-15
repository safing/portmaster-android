import { PluginListenerHandle } from "@capacitor/core";
import GoBridge from "../plugins/go.bridge";

export class DatabaseListener {
    constructor(
        private eventID: String,
        private pluginListener: PluginListenerHandle) { }

    public remove() {
        this.pluginListener.remove();
        GoBridge.RemoveSubscription({ eventID: this.eventID });
    }
}

export class Database {
    private static EventNumber: number = 1;
    public static async Subscribe(query: String, func: (any) => void): Promise<DatabaseListener> {
        var eventID = "db#" + this.EventNumber;
        this.EventNumber += 1;

        var listener = await GoBridge.addListener(eventID, func);
        var result = await GoBridge.DatabaseSubscribe({ name: eventID, query: query });
        if (result?.error != null) {
            console.log("failed to subscribe to", query, ":", result.error);
        }

        return Promise.resolve(new DatabaseListener(eventID, listener));
    }
}