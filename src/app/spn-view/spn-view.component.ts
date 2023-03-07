import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { Database, DatabaseListener } from "../db-interface/module"
import GoBridge from '../plugins/go.bridge';
import { User, SPNStatus } from "../types/spn.types"

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

  private DatabaseListeners: Array<DatabaseListener> = new Array();

  private resumeSubscription: Subscription;

  constructor(private changeDetector: ChangeDetectorRef, private alertController: AlertController, private platform: Platform) {
    this.SPNStatus = null;
  }

  async ngOnInit() {
    var listener = await Database.Subscribe("runtime:spn/status", (msg: SPNStatus) => {
      this.SPNStatus = msg;
      console.log("SPN event", JSON.stringify(msg))
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

    this.resumeSubscription = this.platform.resume.subscribe(() => {
      this.EnableTunnelPopup();
    });
    this.EnableTunnelPopup();
  }

  async ngOnDestroy() {
    this.DatabaseListeners.forEach((listener) => {
      listener.remove();
    });

    this.resumeSubscription.unsubscribe();
  }

  async enableSPN() {
    GoBridge.EnableSPN();
  }

  async disableSPN() {
    GoBridge.DisableSPN();
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

  async Shutdown() {
    const alert = await this.alertController.create({
      header: "Shutting Down Portmaster",
      message: "Shutting down the Portmaster will stop all Portmaster components and will leave your system unprotected!",
      buttons: [
        { 
          text: "Shutdown",
          handler: () => {
            GoBridge.Shutdown();
          }
        },
        { 
          text: "Cancel", 
        }]
    }); 
    await alert.present()
  }

  async EnableTunnelPopup() {
    var active = await GoBridge.IsTunnelActive()
    if(!active) {
      const alert = await this.alertController.create({
              header: "VPN service is disabled!",
              message: "Portmaster requires a virtual VPN connection to Android to work. Click Ok to enable.",
              buttons: [ 
                {
                  text: "Shutdown",
                },
                {
                  text: "Ok",
                  role: "ok"
                  
                },
              ]
            }); 
      await alert.present()
      const { role } =  await alert.onDidDismiss();
      if(role == "ok") {
        GoBridge.EnableTunnel();
        return;
      }
      GoBridge.Shutdown();
    }
  } 
}
