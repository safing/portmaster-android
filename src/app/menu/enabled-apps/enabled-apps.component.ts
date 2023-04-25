import { Component, OnInit } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import GoBridge from '../../plugins/go.bridge';
import JavaBridge from '../../plugins/java.bridge';

import { Application } from './application';
import { SystemAppList } from './enabled-apps.filter';
import { CommonModule, LocationStrategy } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-enabled-apps',
  templateUrl: './enabled-apps.component.html',
  styleUrls: ['./enabled-apps.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SystemAppList]
})
export class EnabledAppsComponent implements OnInit {
  AppList: Application[];

  ShowSystemApps: boolean = false;

  constructor(private locationStrategy: LocationStrategy) {}

  ngOnInit() {
    JavaBridge.getAppSettings().then((result) => {
      this.AppList = result.apps;
      this.AppList.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  Save() {
    var packageNameList: string[] = [];
    this.AppList.forEach(element => {
      if(!element.enabled) {
        packageNameList.push(element.packageName);
      }
    });

    JavaBridge.setAppSettings({apps: packageNameList});
    GoBridge.RestartTunnel();
    this.locationStrategy.back()
  }

  Close() {
    this.locationStrategy.back()
  }
}
