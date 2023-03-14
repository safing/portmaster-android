import { Component, EventEmitter, Input, Output } from "@angular/core";

import { SPNStatus } from "../../types/spn.types";

@Component({
    selector: "spn-button",
    templateUrl: './spn-button.component.html',
})
export class SPNButton {
    @Input() SPNStatus: SPNStatus;
    @Input() IsGeoIPDataAvailable: boolean;

    @Output() onEnable = new EventEmitter();
    @Output() onDisable = new EventEmitter();

    async onClick() {
        switch(this.SPNStatus.Status) {
            case "disabled": {
                this.onEnable.emit()
                break;
            }
            default: {
                this.onDisable.emit();
                break;
            }
        }
    }

    GetButtonText(): string {
        if(!this.IsGeoIPDataAvailable) {
            return "Missing data"
        }

        if(this.SPNStatus == null) {
            return "";
        }

        switch(this.SPNStatus.Status) {
            case "connected": {
                return "disable";
            }
            case "disabled": {
                return "connect";
            }
            case "connecting": {
                return "connecting";
            }
            case "failed": {
                return "disable";
            }
        }
    }

    GetButtonColor(): string {
        if(this.SPNStatus == null) {
            return "";
        }

        if(this.SPNStatus.Status == "disabled") {
            return "primary";    
        }

        return "danger";
    }
}