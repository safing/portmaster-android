import { Component, EventEmitter, Input, Output } from "@angular/core";

import { SPNStatus } from "../types/spn.types";

@Component({
    selector: "spn-button",
    templateUrl: './spn-button.component.html',
})
export class SPNButton {
    @Input() SPNStatus: SPNStatus

    @Output() onEnable = new EventEmitter();
    @Output() onDisable = new EventEmitter();

    private DisableButton: boolean = false;

    async onClick() {
        switch(this.SPNStatus.Status) {
            case "connected": {
                this.onDisable.emit();
                break;
            }
            case "disabled": {
                this.onEnable.emit()
                break;
            }
        }
    }

    GetButtonText(): String {
        if(this.SPNStatus == null) {
            return "";
        }

        switch(this.SPNStatus.Status) {
            case "connected": {
                this.DisableButton = false;
                return "disable";
            }
            case "disabled": {
                this.DisableButton = false;
                return "connect";
            }
            case "connecting": {
                this.DisableButton = true;
                return "connecting";
            }
            case "failed": {
                this.DisableButton = false;
                return "disable";
            }
        }
    }

    GetButtonColor(): String {
        if(this.SPNStatus.Status == "connected") {
            return "danger";
        }

        return "primary";
    }
}