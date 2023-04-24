import { Component, OnInit } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular';
import GoBridge from '../../plugins/go.bridge';
import JavaBridge from '../../plugins/java.bridge';
import { MenuItem } from '../menu.item';

import { Application } from './application';
import { SystemAppList } from './enabled-apps.filter';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-enabled-apps',
  templateUrl: './enabled-apps.component.html',
  styleUrls: ['./enabled-apps.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, SystemAppList]
})
export class EnabledAppsComponent extends MenuItem implements OnInit {
  AppList: Application[];
  ShowSystemApps: boolean = false;

  constructor(private modalCtrl: ModalController) {
    super();
  }

  ngOnInit() {}

  public async show() {
    super.show();
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
