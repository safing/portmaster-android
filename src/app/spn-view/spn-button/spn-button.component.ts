import { Component, EventEmitter, Input, Output } from "@angular/core";

import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { SPNStatus, UserProfile } from "src/app/lib/spn.types";

@Component({
    selector: "spn-button",
    templateUrl: './spn-button.component.html',
    styleUrls: ['./spn-button.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class SPNButton {
    @Input() User: UserProfile;
    @Input() SPNStatus: SPNStatus;
    @Input() IsGeoIPDataAvailable: boolean;

    @Output() onStateChange = new EventEmitter<boolean>();
    @Output() onLogin = new EventEmitter();

    constructor() { }

    async onClick() {
        if(!this.User?.username) {
            this.onLogin.emit();
            return;
        }

        if(!this.IsGeoIPDataAvailable) {
            return;
        }

        switch(this.SPNStatus.Status) {
            case "disabled": {
                this.onStateChange.emit(true)
                this.SPNStatus.Status = "connecting";
                break;
            }
            default: {
                this.onStateChange.emit(false);
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