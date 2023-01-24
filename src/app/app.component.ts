import { Component, OnInit } from '@angular/core';

import { EnabledAppsComponent } from './enabled-apps/enabled-apps.component';
import { LogsComponent } from './logs/logs.component';
import { ModalController, IonRouterOutlet } from '@ionic/angular';

import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;

import {Credentials, User} from "./models/classes"

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

  user: User = null

  constructor(private modalController: ModalController) {}

  async ngOnInit(): Promise<void> {
    this.user = await GoBridge.GetUser()
    this.updateUserCanUseSPNValue(this.user)
    console.log("User: ", JSON.stringify(this.user))

    window.addEventListener('SPN', function (msg: any) {
      console.log('SPN event: ' + JSON.stringify(msg));
    });
  }

  async openAppList() {
    const modal = await this.modalController.create({
      presentingElement: await this.modalController.getTop(),
      canDismiss: true,
      component: EnabledAppsComponent,
      componentProps: {
        rootPage: AppComponent,
      },
     
    });

    await modal.present();
  }

  async openLogs() {
    const modal = await this.modalController.create({
      presentingElement: await this.modalController.getTop(),
      canDismiss: true,
      component: LogsComponent,
      componentProps: {
        rootPage: AppComponent,
      },
    });

    await modal.present();
  }

  async login(credentials: Credentials) {
    this.user = await GoBridge.Login(credentials)
    this.updateUserCanUseSPNValue(this.user)
    console.log("User: ", JSON.stringify(this.user))
  }

  async logout() {
    var result = await GoBridge.Logout()
    if(result?.error) {
      console.log("failed to logout: ", result.error)
    }
    this.user = null
  }

  async updateUserInfo() {
    this.user = await GoBridge.UpdateUserInfo()
    this.updateUserCanUseSPNValue(this.user)
    console.log("User: ", JSON.stringify(this.user))
  }

  updateUserCanUseSPNValue(user: User) {
    user.canUseSPN = user.current_plan?.feature_ids.includes('spn') 
  }
}
