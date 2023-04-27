import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { IonAccordionGroup, IonSlides, IonicModule} from '@ionic/angular';
import GoBridge, { GoInterface } from '../plugins/go.bridge';
import JavaBridge from '../plugins/java.bridge';
import { UpdateState } from '../types/spn.types';
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

  private readonly EventID = "welcome-screen-updater";
  private Listener: PluginListenerHandle;
  Update: UpdateState = new UpdateState();

  NotificationPermissionGranted : boolean = false;
  VPNPermissionGranted : boolean = false;

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

    this.Listener = await GoInterface.addListener(this.EventID, (update: any) => {
      this.Update = update;
      this.changeDetector.detectChanges();
    });

    GoBridge.SubscribeToUpdater({eventID: this.EventID}) 
  }

  ngOnDestroy(): void {
    this.Listener.remove();
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

  public async Continue() {
    this.locationStrategy.back();
  }

  public async RequestVPNPermission() {
    await JavaBridge.requestVPNPermission();
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
