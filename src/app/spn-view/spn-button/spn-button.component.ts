import { Component, EventEmitter, Input, Output } from "@angular/core";

import { SPNStatus, UserProfile } from "../../types/spn.types";

@Component({
    selector: "spn-button",
    templateUrl: './spn-button.component.html',
    standalone: true,
})
export class SPNButton {
    @Input() User: UserProfile;
    @Input() SPNStatus: SPNStatus;
    @Input() IsGeoIPDataAvailable: boolean;

    @Output() onEnable = new EventEmitter();
    @Output() onDisable = new EventEmitter();
    @Output() onLogin = new EventEmitter();

    async onClick() {
        if(!this.User?.username) {
            this.onLogin.emit();
            return;
        }

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
        if(!this.User?.username) {
            return "Login";
        }

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