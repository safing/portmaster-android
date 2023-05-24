import { Component, OnInit, ChangeDetectorRef, OnDestroy, inject, EnvironmentInjector } from '@angular/core';
import { AlertController, IonicModule, LoadingController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import GoBridge from '../plugins/go.bridge';
import { SPNButton } from './spn-button/spn-button.component';
import { DownloadProgressComponent } from './download-progress/download-progress.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SecurityLockComponent } from './security-lock/security-lock';
import { FormsModule } from '@angular/forms';
import { Notification, getNotificationTypeString } from '../services/notifications.types';
import { SPNStatus, UserProfile } from '../lib/spn.types';
import { SPNService } from '../lib/spn.service';
import { ConfigService } from '../lib/config.service';
import { NotificationsService } from '../services/notifications.service';
import { ShutdownService } from '../services/shutdown.service';
import { NotificationComponent } from './notification/notification.component';

@Component({
  selector: 'spn-view-container',
  templateUrl: './spn-view.component.html',
  styleUrls: ['./spn-view.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SPNButton, DownloadProgressComponent, SecurityLockComponent, NotificationComponent]
})
export class SPNViewComponent implements OnInit, OnDestroy {
  User: UserProfile;

  SPNStatus: SPNStatus | null;
  SPNErrorMsg: string = "";
  IsGeoIPDataAvailable: boolean = false;

  private resumeEventSubscription: Subscription;

  notifications: Notification[];
  
  public environmentInjector = inject(EnvironmentInjector);

  constructor(private changeDetector: ChangeDetectorRef,
    private shutdownService: ShutdownService,
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

        this.spnService.watchProfile().subscribe((user: UserProfile) => {
          this.User = user;
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
    this.shutdownService.promptShutdown();
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
    }
}
