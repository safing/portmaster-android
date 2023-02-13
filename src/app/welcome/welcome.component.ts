import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { IonSlides, ModalController } from '@ionic/angular';

import { Plugins } from '@capacitor/core';
const {JavaBridge} = Plugins

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

  async ngOnInit() {
    var result = await JavaBridge.isNotificationPermissionGranted();
    this.NotificationPermissionGranted = result.granted;

    result = await JavaBridge.isVPNPermissionGranted();
    this.VPNPermissionGranted = result.granted;

    window.addEventListener("vpn-permission", (msg: any) => {
      this.VPNPermissionGranted = msg.granted;
    });
  }

  async onActiveIndexChange() {
    var index = await this.slides.getActiveIndex();
    if(index == Slides.Download) {
      this.slides.lockSwipeToNext(true);
    } else {
      this.slides.lockSwipeToNext(false);
    }
  }

  async Download() {
    this.slides.lockSwipeToNext(false);
    this.slides.slideNext();
    JavaBridge.initEngine();
  }

  async Continue() {
    this.onExit.emit();
  }

  async RequestVPNPermission() {
    JavaBridge.requestVPNPermission();
  }

  async RequestNotificationPermission() {
    var result = await JavaBridge.requestNotificationsPermission();
    console.log(JSON.stringify(result))
    this.NotificationPermissionGranted = result.granted;
  }

}
