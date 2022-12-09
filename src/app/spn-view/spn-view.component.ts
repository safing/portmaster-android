import { Component, OnInit, Input, Output } from '@angular/core';


import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;
const { JavaBridge } = Plugins;


@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
})
export class SPNViewComponent implements OnInit {
  Status: String = "SPN is disabled"
  IsSPNEnabled: boolean;

  constructor() {
    this.IsSPNEnabled = false
  }
  
  async ngOnInit() {
    this.stateUpdater()

    var state = await GoBridge.getState()
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
      var state = await GoBridge.onStateChange()
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

}
