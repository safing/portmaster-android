import { Component, EnvironmentInjector, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { EnabledAppsComponent } from './menu/enabled-apps/enabled-apps.component';
import { LogsComponent } from './menu/logs/logs.component';
import { LoadingController, ModalController} from '@ionic/angular';

import {UserProfile} from "./types/spn.types"
import JavaBridge from './plugins/java.bridge';
import GoBridge from './plugins/go.bridge';
import { BugReportComponent } from './menu/bug-report/bug-report.component';
import { UserInfoComponent } from './menu/user-info/user-info.component';
import { VpnSettingsComponent } from './menu/vpn-settings/vpn-settings.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AppComponent implements OnInit, OnDestroy {
  User: UserProfile = null;
  ShowWelcomeScreen: boolean = false;
  LoginError: string = "";

  // @ViewChild("userinfo") UserInfoModal: UserInfoComponent;
  // @ViewChild("bugreport") BugReportModal: BugReportComponent;
  // @ViewChild("enabledapps") EnabledAppsModal: EnabledAppsComponent;
  // @ViewChild("logs") LogsModal: LogsComponent;
  // @ViewChild("vpnsettings") VPNSettings: VpnSettingsComponent;

  constructor(private modalController: ModalController, private loadingCtrl: LoadingController) {}
  async ngOnInit(): Promise<void> {
    var result = await JavaBridge.shouldShowWelcomeScreen();
    this.ShowWelcomeScreen = result.show;
    try {
      this.User = await GoBridge.GetUser();
      this.updateUserCanUseSPNValue(this.User);
    } catch (err) {}
  }

  ngOnDestroy(): void {}

  public async login(credentials: [string, string]) {
    try {
      this.User = await GoBridge.Login({username: credentials[0], password: credentials[1]});
      this.updateUserCanUseSPNValue(this.User);
      console.log("User: ", JSON.stringify(this.User));
      this.LoginError = "";
    } catch(err) {
      this.LoginError = err;
    }
  }

  public async logout() {
    this.User = null;
    this.LoginError = "";
    await GoBridge.DisableSPN();
    await GoBridge.Logout();
  }

  public onWelcomeScreenExit() {
    this.ShowWelcomeScreen = false;
  }

  public async updateUserInfo() {
    try {
      this.User = await GoBridge.UpdateUserInfo();
      this.updateUserCanUseSPNValue(this.User);
      console.log("User: ", JSON.stringify(this.User));
    } catch(err) {
      console.log("failed to update user info:", err)
    }
  }

  public exportDebugInfo() {
    GoBridge.GetDebugInfoFile();
  }

  private updateUserCanUseSPNValue(user: UserProfile) {
    user.canUseSPN = user.current_plan?.feature_ids.includes('spn');
  }

  showShutdownOverlay() {
    this.loadingCtrl.create({
      message: 'Shuting down...',
      duration: 0,
      spinner: 'circular',
    }).then((loading) => {
      loading.present();
    });
  }
}
