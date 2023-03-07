import { PluginListenerHandle } from "@capacitor/core";
import GoBridge, { GoInterface } from "../plugins/go.bridge";

export class DatabaseListener {
    constructor(
        private eventID: string,
        private pluginListener: PluginListenerHandle) { }

    public remove() {
        this.pluginListener.remove();
        GoBridge.RemoveSubscription(this.eventID);
    }
}

export class Database {
    private static EventNumber: number = 1;
    public static async Subscribe(query: string, func: (any) => void): Promise<DatabaseListener> {
        var eventID = "db#" + this.EventNumber;
        this.EventNumber += 1;

        // Create a listener, on which GoBridge will send events to.
        var listener = await GoInterface.addListener(eventID, func);

        // Subscribe to the event.
        var result = await GoBridge.DatabaseSubscribe({ name: eventID, query: query });
        // if (result?.error != null) {
        //     console.log("failed to subscribe to", query, ":", result.error);
        // }

        return Promise.resolve(new DatabaseListener(eventID, listener));
    }
}