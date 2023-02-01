
import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;

export class Database {
    private static EventNumber: number = 1;
    public static Subscribe(query: String, listener: (any) => void): String {
        var eventId = "db#" + this.EventNumber;
        var args = {Name: eventId, Query: query}
        GoBridge.DatabaseSubscribe(args);
        window.addEventListener(eventId, listener);
        this.EventNumber += 1;
        return eventId;
    }
}