import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';


import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;
const { JavaBridge } = Plugins;
import {User} from "../models/classes"

@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
})
export class SPNViewComponent implements OnInit {
  @Input() user: User
  @Output() onLogout = new EventEmitter();

  Status: String = "SPN is disabled"
  IsSPNEnabled: boolean;

  constructor() {
    this.IsSPNEnabled = false
  }
  
  async ngOnInit() {
    this.stateUpdater()

    var state = await GoBridge.GetState()
    this.updateState(state.active)
  }
  
  async toggleSPN(state) {
    if(state) {
      await JavaBridge.enableTunnel()
    } else {
      await JavaBridge.disableTunnel()
    }
  }

  async stateUpdater() {
    while(true) {
      var state = await GoBridge.WaitForStateChange()
      console.log("State changed: ", state.active)
      this.updateState(state.active)
    }
  }

  updateState(newState) {
    this.IsSPNEnabled = newState
    if(newState) {
      this.Status = "SPN is enabled"
    } else {
      this.Status = "SPN is disabled"
    }
  }

  async logout() {
    this.onLogout.emit()
  }

}
