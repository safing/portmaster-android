import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { Database, DatabaseListener } from "../db-interface/module"
import GoBridge from '../plugins/go.bridge';
import { User, SPNStatus, TunnelStatus } from "../types/spn.types"

@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
})
export class SPNViewComponent implements OnInit, OnDestroy {
  @Input() User: User;
  @Output() onLogout = new EventEmitter();
  @Output() onUpdateUserInfo = new EventEmitter();

  private SPNStatus: SPNStatus | null;
  private SPNErrorMsg: string = "";
  private TunnelStatus: TunnelStatus | null;

  private DatabaseListeners: Array<DatabaseListener> = new Array();

  constructor(private changeDetector: ChangeDetectorRef) {
    this.SPNStatus = null;
  }

  async ngOnInit() {
    this.initTunnelState()

    window.addEventListener("tunnel", (msg: any) => {
      console.log("Tunnel event", JSON.stringify(msg));
      this.TunnelStatus = msg as TunnelStatus;
      this.changeDetector.detectChanges();
    });

    var listener = await Database.Subscribe("runtime:spn/status", (msg: SPNStatus) => {
      this.SPNStatus = msg;
      console.log("SPN event", JSON.stringify(msg))
      if (this.SPNStatus.Status == "connected" && this.TunnelStatus.Status == "disabled") {
        GoBridge.EnableTunnel();
      }

      // Update UI.
      this.changeDetector.detectChanges();
    });

    this.DatabaseListeners.push(listener);

    listener = await Database.Subscribe("runtime:subsystems/spn", (msg: any) => {
      this.SPNErrorMsg = msg.Modules[0].FailureMsg;
      console.log("runtime:subsystems/spn", this.SPNErrorMsg)
      // Update UI.
      this.changeDetector.detectChanges();
    });

    this.DatabaseListeners.push(listener);
  }

  async ngOnDestroy() {
    this.DatabaseListeners.forEach((listener) => {
      listener.remove();
    });
  }

  async enableSPN() {
    // Tunnel is going to enable the SPN
    GoBridge.EnableTunnel();
  }

  async disableSPN() {
    GoBridge.DisableSPN();
    GoBridge.DisableTunnel();
  }

  async updateUserInfo() {
    this.onUpdateUserInfo.emit()
  }

  isSPNConnected(): boolean {
    if (this.SPNStatus == null) {
      return false;
    }
    return this.SPNStatus?.Status == "connected";
  }

  isSPNDisabled(): boolean {
    if (this.SPNStatus == null) {
      return true;
    }
    return this.SPNStatus?.Status == "disabled";
  }

  async initTunnelState() {
    this.TunnelStatus = await GoBridge.GetTunnelStatus();
  }

}
