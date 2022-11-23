import { Component, OnInit, Input, Output } from '@angular/core';


import { Plugins } from '@capacitor/core';
const { UIBridge } = Plugins;


@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
})
export class ExploreContainerComponent implements OnInit {
  @Output() status: String;
  @Output() buttonClass: String;
  @Output() buttonText: String;

  interval;
  isVPNEnabled;


  constructor() {
    this.isVPNEnabled = false
  }
  
  ngOnInit() {
    this.status = "Disabled";
    this.buttonClass = "enable-button"
    this.buttonText = "Enable SPN"
  }
  
  async enableSPN() {
    if(this.isVPNEnabled) {
      this.status = "Disabled";
      this.buttonClass = "disabled"
    } else {
      this.status = "Enabled";
      this.buttonClass = "disabled"
    }
    
    // clearInterval(this.interval)
    // await UIBridge.connectVPN()
    // var result = await UIBridge.isVPNActive()
    // this.isVPNEnabled = result.value
    // console.log("Result: ", result.value);
    // this.updateUI(this.isVPNEnabled)
    // this.startTimer()
    var result = await UIBridge.isActiveUI()
    console.log("Is active: ", result.active)
  }

  startTimer() {
    this.interval = setInterval(async () => {
      var result = await UIBridge.isVPNActive()
      console.log("Result: ", result.value)
      this.isVPNEnabled = result.value
      this.updateUI(this.isVPNEnabled)
    }, 1000)
  }

  updateUI(isVPNActive) {
    if(isVPNActive) {
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
