import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';


import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;
import {User, SPNStatus} from "../models/classes"

@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
})
export class SPNViewComponent implements OnInit {
  @Input() user: User
  @Output() onLogout = new EventEmitter();
  @Output() onUpdateUserInfo = new EventEmitter();

  SPNStatus: SPNStatus
  ToggleState: boolean;
  UpdateStatus: boolean;

  constructor() {
    this.SPNStatus = new SPNStatus()
  }
  
  async ngOnInit() {
    // this.stateUpdater()
    
    // var state = await GoBridge.GetState()
    // this.TunnelEnabled = state.active
    this.ToggleState = false;
    this.UpdateStatus = true;
    // this.spnStatusUpdater()
  }

  async ngOnDestroy() {
    this.UpdateStatus = false;
  }
  
  async toggleSPN(state) {
    if(state) {
      await GoBridge.EnableSPN()
    } else {
      await GoBridge.DisableSPN()
    }
  }

  async spnStatusUpdater() {
    while(this.UpdateStatus) {
      this.SPNStatus = await GoBridge.GetSPNStatus()
      await this.sleep(1000)
    }
  }

  async logout() {
    this.onLogout.emit()
  }

  async updateUserInfo() {
    this.onUpdateUserInfo.emit()
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isSPNConnected() : boolean {
    return this.SPNStatus.Status == "connected"
  }

  isSPNDisabled() : boolean {
    return this.SPNStatus.Status == "disabled"
  }

}
