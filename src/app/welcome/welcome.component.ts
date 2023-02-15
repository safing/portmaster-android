import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { IonSlides, ModalController } from '@ionic/angular';
import JavaBridge from '../plugins/java.bridge';


enum Slides {
    Welcome = 0,
    Permissions = 1,
    Download = 2,
    Continue = 3,
}

@Component({
  selector: 'welcome-screen',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {

  @Output() onExit = new EventEmitter();
  @ViewChild('slides') slides: IonSlides;

  private NotificationPermissionGranted : boolean = false;
  private VPNPermissionGranted : boolean = false;

  constructor() { }

  public async ngOnInit() {
    var result = await JavaBridge.isNotificationPermissionGranted();
    this.NotificationPermissionGranted = result.granted;

    result = await JavaBridge.isVPNPermissionGranted();
    this.VPNPermissionGranted = result.granted;

    window.addEventListener("vpn-permission", (msg: any) => {
      this.VPNPermissionGranted = msg.granted;
    });
  }

  public async onActiveIndexChange() {
    var index = await this.slides.getActiveIndex();
    if(index == Slides.Download) {
      this.slides.lockSwipeToNext(true);
    } else {
      this.slides.lockSwipeToNext(false);
    }
  }

  public async Download() {
    this.slides.lockSwipeToNext(false);
    this.slides.slideNext();
    JavaBridge.initEngine();
  }

  public async Continue() {
    this.onExit.emit();
  }

  public async RequestVPNPermission() {
    JavaBridge.requestVPNPermission();
  }

  public async RequestNotificationPermission() {
    var result = await JavaBridge.requestNotificationsPermission();
    this.NotificationPermissionGranted = result.granted;
  }

}
