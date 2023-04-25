import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AlertController, IonicModule, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { Database, DatabaseListener } from "../db-interface/module"
import GoBridge from '../plugins/go.bridge';
import { UserProfile, SPNStatus } from "../types/spn.types"
import { SPNButton } from './spn-button/spn-button.component';
import { DownloadProgressComponent } from './download-progress/download-progress.component';
import { CommonModule } from '@angular/common';
import { SPNService } from '../services/spn.service';
import { Router } from '@angular/router';

@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
  standalone: true,
  imports: [SPNButton, DownloadProgressComponent, CommonModule, IonicModule]
})
export class SPNViewComponent implements OnInit, OnDestroy {
  User: UserProfile;
  
  SPNStatus: SPNStatus | null;
  SPNErrorMsg: string = "";
  IsGeoIPDataAvailable: boolean = false;

  private DatabaseListeners: Array<DatabaseListener> = new Array();

  private resumeSubscription: Subscription;

  constructor(private changeDetector: ChangeDetectorRef, 
              private alertController: AlertController,
              private platform: Platform,
              private spnService: SPNService,
              private router: Router) {
    this.SPNStatus = null;
  }

  async ngOnInit() {
    this.spnService.watchSPNStatus().subscribe((status: SPNStatus) => {
      if(status == null) {
        return;
      }
      this.SPNStatus = status;
      console.log("Spn status update:", JSON.stringify(status));
      // Update UI.
      this.changeDetector.detectChanges();
    });

    this.spnService.watchProfile().subscribe((user: UserProfile) => {
      this.User = user;
      console.log("User profile update:", JSON.stringify(user));

      if(user != null) {
        this.User.canUseSPN = user.current_plan?.feature_ids.includes('spn');
      }

      // Update UI.
      this.changeDetector.detectChanges();
    });

    var listener = await Database.Subscribe("runtime:subsystems/spn", (msg: any) => {
      this.SPNErrorMsg = msg.Modules[0].FailureMsg;
      console.log("runtime:subsystems/spn", this.SPNErrorMsg)
      // Update UI.
      this.changeDetector.detectChanges();
    });

    this.DatabaseListeners.push(listener);

    this.resumeSubscription = this.platform.resume.subscribe(() => {
      this.EnableTunnelPopup();
      this.CheckGeoIPData();
    });

    this.EnableTunnelPopup();
    this.CheckGeoIPData();
  }

  async ngOnDestroy() {
    this.DatabaseListeners.forEach((listener) => {
      listener.unsubscribe();
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
    // this.onUpdateUserInfo.emit()
    this.spnService.userProfile(true);
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
            // TODO: show shutdown overlay
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

  openLoginPage() {
    console.log("onLogin event");
    this.router.navigate(["/login"])
  }

  async CheckGeoIPData() {
    this.IsGeoIPDataAvailable = await GoBridge.IsGeoIPDataAvailable();
    this.changeDetector.detectChanges();
  }
}
