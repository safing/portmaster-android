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

  user: User = {loggedIn: false}

  constructor(private modalController: ModalController) {}

  async ngOnInit(): Promise<void> {
    this.user = await GoBridge.GetUser()
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
    console.log("CCC", JSON.stringify(credentials, null, 4))
    this.user = await GoBridge.Login(credentials)
    console.log("User: ", JSON.stringify(this.user))
  }

  async logout() {
    var result = await GoBridge.Logout()
    if(result?.error) {
      console.log("failed to logout: ", result.error)
    }
    this.user = {loggedIn: false}
  }
}
