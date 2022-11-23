import { Component, OnInit, Input, Output } from '@angular/core';


import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;
const { JavaBridge } = Plugins;


@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
})
export class ExploreContainerComponent implements OnInit {
  @Output() status: String;
  @Output() buttonClass: String;
  @Output() buttonText: String;

  isVPNEnabled;

  constructor() {
    this.isVPNEnabled = false
  }
  
  ngOnInit() {
    this.status = "Disabled";
    this.buttonClass = "enable-button"
    this.buttonText = "Enable SPN"
    this.stateUpdater()
  }
  
  async enableSPN() {
    if(this.isVPNEnabled) {
      await JavaBridge.disableTunnel()
    } else {
      await JavaBridge.enableTunnel()
    }
  }

  async stateUpdater() {
    while(true) {
      var state = await GoBridge.onStateChange()
      this.isVPNEnabled = state.active
      if(state.active) {
        this.status = "Enabled"
        this.buttonClass = "disable-button"
        this.buttonText = "Disable SPN"
      } else {
        this.status = "Disabled"
        this.buttonClass = "enable-button"
        this.buttonText = "Enable SPN"
      }
    }
  }

}
