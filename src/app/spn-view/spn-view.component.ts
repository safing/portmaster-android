import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy, inject, EnvironmentInjector } from '@angular/core';
import { AlertController, IonicModule, LoadingController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import GoBridge from '../plugins/go.bridge';
import { SPNButton } from './spn-button/spn-button.component';
import { DownloadProgressComponent } from './download-progress/download-progress.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SecurityLockComponent } from './security-lock/security-lock';
import { FormsModule } from '@angular/forms';
import { Notification, NotificationState, NotificationType, getNotificationTypeString } from '../services/notifications.types';
import { SPNStatus, UserProfile } from '../lib/spn.types';
import { SPNService } from '../lib/spn.service';
import { ConfigService } from '../lib/config.service';
import { NotificationsService } from '../services/notifications.service';
// import { SPNService, SPNStatus, UserProfile } from '@safing/portmaster-api';

@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SPNButton, DownloadProgressComponent, SecurityLockComponent]
})
export class SPNViewComponent implements OnInit, OnDestroy {
  User: UserProfile;

  SPNStatus: SPNStatus | null;
  SPNErrorMsg: string = "";
  IsGeoIPDataAvailable: boolean = false;

  private resumeEventSubscription: Subscription;

  private notifications: Notification[];
  //[{EventID:"spn:home-hub-failure",GUID:"b1cb1a66-8583-5373-a13f-da391b224bde",Type:1,Title:"SPN Failed to Connect",Category:"",Message:"Failed to connect to a home hub: failed to connect to a new home hub - tried 32 hubs: failed to launch ship: failed to connect to using tcp:17 (185.186.245.108): dial tcp 185.186.245.108:17: connect: connection refused. The Portmaster will retry to connect automatically.",EventData:null,Expires:0,State: NotificationState.Active, AvailableActions: null, SelectedActionID:"",_meta:{Created:1683721388,Modified:1683721388,Expires:0,Deleted:0,Key:"notifications:all/spn:home-hub-failure"}}];

  public environmentInjector = inject(EnvironmentInjector);

  constructor(private changeDetector: ChangeDetectorRef,
    private loadingCtrl: LoadingController,
    private alertController: AlertController,
    private platform: Platform,
    private spnService: SPNService,
    private configService: ConfigService,
    private notificationService: NotificationsService,
    private router: Router) {
    this.SPNStatus = null;
  }

  ngOnInit() {
    this.spnService.status$.subscribe((status: SPNStatus) => {
      if (status == null) {
        return;
      }
      this.SPNStatus = status;
      console.log("Spn status update:", JSON.stringify(status));
      // Update UI.
      this.changeDetector.detectChanges();
    });

    this.spnService.userProfile().subscribe(
      (user: UserProfile) => {
        this.User = user;
        console.log("User profile initialize:", JSON.stringify(user));

        this.spnService.watchProfile().subscribe((user: UserProfile) => {
          this.User = user;
          console.log("User profile update:", JSON.stringify(user));
        });

        // Update UI.
        this.changeDetector.detectChanges();
      },
      (error: string) => {
        console.log(error);
      });

    this.resumeEventSubscription = this.platform.resume.subscribe(() => {
      this.EnableTunnelPopup();
      this.CheckGeoIPData();
    });

    this.EnableTunnelPopup();
    this.CheckGeoIPData();

    this.notificationService.new$
    .subscribe((notifications: Notification[]) => {
      console.log("New Notification:", JSON.stringify(notifications));
      this.notifications = notifications;
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy() {
    this.resumeEventSubscription.unsubscribe();
  }

  openUserInfo() {
    if (this.User?.username) {
      this.router.navigate(["/menu/user-info"]);
    } else {
      this.router.navigate(["/login"]);
    }
  }

  setSPNEnabled(v: boolean) {
    this.configService.save(`spn/enable`, v)
      .subscribe();
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

  Shutdown() {
    this.alertController.create({
      header: "Shutting Down Portmaster",
      message: "Shutting down the Portmaster will stop all Portmaster components and will leave your system unprotected!",
      buttons: [
        {
          text: "Shutdown",
          handler: () => {
            this.showShutdownOverlay();
            GoBridge.Shutdown();
          }
        },
        {
          text: "Cancel",
        }]
    }).then((alert) => {
      alert.present()
    });
  }

  async EnableTunnelPopup() {
    var active = await GoBridge.IsTunnelActive()
    if (!active) {
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
      const { role } = await alert.onDidDismiss();
      if (role == "ok") {
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

  CheckGeoIPData() {
    GoBridge.IsGeoIPDataAvailable().then((isAvailable) => {
      this.IsGeoIPDataAvailable = isAvailable;
      this.changeDetector.detectChanges();
    });
  }

  showShutdownOverlay() {
    this.loadingCtrl.create({
      message: 'Shuting down...',
      duration: 0,
      spinner: 'circular',
    }).then((loading) => {
      loading.present();
    });
  }

  openConnectionInfo() {
    if (this.SPNStatus.Status != "connected") {
      return;
    }

    this.alertController.create({
      header: 'SPN Connection',
      subHeader: "",
      message: 'Home: ' + this.SPNStatus.HomeHubName + "<br>" +
        this.SPNStatus.ConnectedIP + " " + this.SPNStatus.ConnectedTransport + "<br>",
      buttons: ['Close'],
    }).then((alert) => {
      alert.present();
    });
  }

  openNotification(notification: Notification) {
    this.alertController.create({
      header: notification.Title,
      subHeader: getNotificationTypeString(notification.Type),
      message: notification.Message,
      buttons: ['Close'],
    }).then((alert) => {
      alert.present();
    });
  }
}
