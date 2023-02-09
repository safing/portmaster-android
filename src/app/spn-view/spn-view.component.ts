import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';


import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;

import {Database} from "../db-interface/module"
import {User, SPNStatus, TunnelStatus} from "../types/spn.types"

@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
})
export class SPNViewComponent implements OnInit {
  @Input() User: User;
  @Output() onLogout = new EventEmitter();
  @Output() onUpdateUserInfo = new EventEmitter();

  SPNStatus: SPNStatus | null;
  SPNErrorMsg: String = "";
  TunnelStatus: TunnelStatus | null;
  ToggleState: boolean = false;

  constructor() {
    this.SPNStatus = null;
  }
  
  async ngOnInit() {
    this.TunnelStatus = await GoBridge.GetTunnelStatus();
    this.ToggleState = this.TunnelStatus?.Status == "connected";    

    window.addEventListener("tunnel", (msg: any) => {
      console.log("Tunnel event", JSON.stringify(msg));
      this.TunnelStatus = msg as TunnelStatus;
      this.ToggleState = this.TunnelStatus.Status == "connected";
    });

    Database.Subscribe("runtime:spn/status", (msg: SPNStatus) => {
      this.SPNStatus = msg
      console.log("SPN event", JSON.stringify(msg))
      if(this.SPNStatus.Status == "connected" && this.TunnelStatus.Status == "disabled") {
        GoBridge.EnableTunnel()
      }
    });

    Database.Subscribe("runtime:subsystems/spn", (msg: any) => {
      this.SPNErrorMsg = msg.Modules[0].FailureMsg;
    });

    // TODO(vladimir): add notification handling.
    Database.Subscribe("notifications:all/", (msg: SPNStatus) => {});
  }

  async ngOnDestroy() {
    
  }
  
  async toggleSPN(state) {
    if(state) {
      await GoBridge.EnableSPN();
      await GoBridge.EnableTunnel();
    } else {
      await GoBridge.DisableTunnel();
      await GoBridge.DisableSPN();
    }
  }

  async updateUserInfo() {
    this.onUpdateUserInfo.emit()
  }

  isSPNConnected() : boolean {
    if(this.SPNStatus == null) {
      return false;
    }
    return this.SPNStatus?.Status == "connected"
  }

  isSPNDisabled() : boolean {
    if(this.SPNStatus == null) {
      return true;
    }
    return this.SPNStatus?.Status == "disabled"
  }

}
