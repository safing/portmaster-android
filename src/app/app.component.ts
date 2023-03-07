import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { EnabledAppsComponent } from './menu/enabled-apps/enabled-apps.component';
import { LogsComponent } from './menu/logs/logs.component';
import { ModalController} from '@ionic/angular';

import {User} from "./types/spn.types"
import JavaBridge from './plugins/java.bridge';
import GoBridge from './plugins/go.bridge';
import { BugReportComponent } from './menu/bug-report/bug-report.component';
import { UserInfoComponent } from './menu/user-info/user-info.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private User: User = null;
  private ShowWelcomeScreen: boolean = false;

  @ViewChild("userinfo") UserInfoModal: UserInfoComponent;
  @ViewChild("bugreport") BugReportModal: BugReportComponent;
  @ViewChild("enabledapps") EnabledAppsModal: EnabledAppsComponent;
  @ViewChild("logs") LogsModal: LogsComponent;

  constructor(private modalController: ModalController) {}
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
    this.User = await GoBridge.Login({username: credentials[0], password: credentials[1]});
    this.updateUserCanUseSPNValue(this.User);
    console.log("User: ", JSON.stringify(this.User));
  }

  public async logout() {
    this.User = null;
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

  private updateUserCanUseSPNValue(user: User) {
    user.canUseSPN = user.current_plan?.feature_ids.includes('spn');
  }
}
