import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { IonAccordionGroup, IonSlides, IonicModule} from '@ionic/angular';
import GoBridge, { GoInterface } from '../plugins/go.bridge';
import JavaBridge from '../plugins/java.bridge';
import { RegistryState } from '../services/updater.types';
import { CommonModule, LocationStrategy } from '@angular/common';


enum Slides {
    Welcome = 0,
    Permissions = 1,
    Download = 2,
    Continue = 3,
}

@Component({
  selector: 'welcome-screen',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  imports: [CommonModule, IonicModule]
})
export class WelcomeComponent implements OnInit, OnDestroy {
  @ViewChild('slides') slides: IonSlides;
  @ViewChild('permissionsGroup', { static: true }) permissionsGroup: IonAccordionGroup;

  IsOnWifi: boolean = false;

  NotificationPermissionGranted: boolean = false;
  VPNPermissionGranted: boolean = false;

  constructor(private changeDetector: ChangeDetectorRef, private locationStrategy: LocationStrategy) { }

  public async ngOnInit() {
    var result = await JavaBridge.isNotificationPermissionGranted();
    this.NotificationPermissionGranted = result.granted;

    result = await JavaBridge.isVPNPermissionGranted();
    this.VPNPermissionGranted = result.granted;

    window.addEventListener("vpn-permission", (msg: any) => {
      this.VPNPermissionGranted = msg.granted;
    });
    this.permissionsGroup.value = "vpn";

    GoBridge.IsOnWifiNetwork().then((onWifi) => {
      this.IsOnWifi = onWifi;
    });
  }

  ngOnDestroy(): void {
  }

  public async onActiveIndexChange() {
    var index = await this.slides.getActiveIndex();
    if(index == Slides.Download) {
      this.slides.lockSwipeToNext(true);
    } else {
      this.slides.lockSwipeToNext(false);
    }
  }

  public Download() {
    this.slides.lockSwipeToNext(false);
    this.slides.slideNext();
    GoBridge.DownloadPendingUpdates();
    JavaBridge.setWelcomeScreenShowed({showed: true});
  }

  public WaitForWifi() {
    this.slides.lockSwipeToNext(false);
    this.slides.slideNext();
    GoBridge.DownloadUpdatesOnWifiConnected();
    JavaBridge.setWelcomeScreenShowed({showed: true});
  } 

  public Continue() {
    this.locationStrategy.back();
  }

  public RequestVPNPermission() {
    JavaBridge.requestVPNPermission();
    this.permissionsGroup.value = "notifications";
  }

  public async RequestNotificationPermission() {
    var result = await JavaBridge.requestNotificationsPermission();
    this.NotificationPermissionGranted = result.granted;
    this.permissionsGroup.value = "apps";
  }

  public NetworkState() {
    this.permissionsGroup.value = "netstate";
  }

  public NextSlide() {
    this.slides.slideNext();
  }
}
