import { Component, OnInit } from '@angular/core';

import { Plugins } from '@capacitor/core';
const { JavaBridge } = Plugins;
import { BrowserModule } from '@angular/platform-browser'

interface Application {
  packageName: string
  name: string
  enabled: boolean
}

@Component({
  selector: 'app-enabled-apps',
  templateUrl: './enabled-apps.component.html',
  styleUrls: ['./enabled-apps.component.scss'],
})
export class EnabledAppsComponent implements OnInit {
  appList: Application[];

  constructor() { }

  async ngOnInit() {
    var result = await JavaBridge.getAppSettings()
    this.appList = result.apps
    this.appList.sort((a, b) => a.name.localeCompare(b.name))
  }

  async onSave() {
    var packageNameList: string[] = []
    this.appList.forEach(element => {
      if(!element.enabled) {
        packageNameList.push(element.packageName)
      }
    });
    JavaBridge.setAppSettings({apps: packageNameList});
  }

}
