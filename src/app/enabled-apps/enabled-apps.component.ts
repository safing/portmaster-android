import { Component, OnInit } from '@angular/core';

import { ModalController } from '@ionic/angular';
import GoBridge from '../plugins/go.bridge';
import JavaBridge from '../plugins/java.bridge';

import { Application } from './application';

@Component({
  selector: 'app-enabled-apps',
  templateUrl: './enabled-apps.component.html',
  styleUrls: ['./enabled-apps.component.scss'],
})
export class EnabledAppsComponent implements OnInit {
  AppList: Application[];
  ShowSystemApps: boolean = false;

  constructor(private modalCtrl: ModalController) { }

  async ngOnInit() {
    var result = await JavaBridge.getAppSettings();
    this.AppList = result.apps;
    this.AppList.sort((a, b) => a.name.localeCompare(b.name));
  }

  async Cancel() {
    this.modalCtrl.dismiss(null);
  }

  async Save() {
    var packageNameList: string[] = [];
    this.AppList.forEach(element => {
      if(!element.enabled) {
        packageNameList.push(element.packageName);
      }
    });
    JavaBridge.setAppSettings({apps: packageNameList});
    GoBridge.RestartTunnel();
    this.modalCtrl.dismiss(null);
  }

}
