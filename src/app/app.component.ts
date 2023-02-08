import { Component, OnInit } from '@angular/core';

import { EnabledAppsComponent } from './enabled-apps/enabled-apps.component';
import { LogsComponent } from './logs/logs.component';
import { ModalController, IonRouterOutlet } from '@ionic/angular';

import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;

import {Credentials, User} from "./types/spn.types"

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

  private User: User = null

  constructor(private modalController: ModalController) {}

  async ngOnInit(): Promise<void> {
    this.User = await GoBridge.GetUser()
    this.updateUserCanUseSPNValue(this.User)
    console.log("User: ", JSON.stringify(this.User))
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

  async openEnabledApps() {
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

  async login(credentials: Credentials) {
    this.User = await GoBridge.Login(credentials)
    this.updateUserCanUseSPNValue(this.User)
    console.log("User: ", JSON.stringify(this.User))
  }

  async logout() {
    await GoBridge.DisableTunnel();
    await GoBridge.DisableSPN();
    var result = await GoBridge.Logout()
    if(result?.error) {
      console.log("failed to logout: ", result.error)
    }
    this.User = null
  }

  async updateUserInfo() {
    this.User = await GoBridge.UpdateUserInfo()
    this.updateUserCanUseSPNValue(this.User)
    console.log("User: ", JSON.stringify(this.User))
  }

  async exportDebugInfo() {
    await GoBridge.GetDebugInfoFile()
  }

  updateUserCanUseSPNValue(user: User) {
    user.canUseSPN = user.current_plan?.feature_ids.includes('spn') 
  }
}
