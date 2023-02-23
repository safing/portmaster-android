import { AfterViewInit, Component, OnInit } from '@angular/core';

import { EnabledAppsComponent } from './enabled-apps/enabled-apps.component';
import { LogsComponent } from './logs/logs.component';
import { ModalController } from '@ionic/angular';

import {User} from "./types/spn.types"
import JavaBridge from './plugins/java.bridge';
import GoBridge from './plugins/go.bridge';
import { BugReportComponent } from './bug-report/bug-report.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  private User: User = null;
  private ShowWelcomeScreen: boolean = false;

  constructor(private modalController: ModalController) {}

  async ngOnInit(): Promise<void> {
    var result = await JavaBridge.shouldShowWelcomeScreen();
    this.ShowWelcomeScreen = result.show;

    this.User = await GoBridge.GetUser();
    this.updateUserCanUseSPNValue(this.User);
  }

  public async openAppList() {
    const modal = await this.modalController.create({
      presentingElement: await this.modalController.getTop(),
      canDismiss: true,
      component: EnabledAppsComponent,
      componentProps: {
        rootPage: AppComponent,
      },
    });

    modal.present();
  }

  public async openLogs() {
    const modal = await this.modalController.create({
      presentingElement: await this.modalController.getTop(),
      canDismiss: true,
      component: LogsComponent,
      componentProps: {
        rootPage: AppComponent,
      },
    });

    modal.present();
  }

  public async openEnabledApps() {
    const modal = await this.modalController.create({
      presentingElement: await this.modalController.getTop(),
      canDismiss: true,
      component: EnabledAppsComponent,
      componentProps: {
        rootPage: AppComponent,
      },
    });

    modal.present();
  }

  public async openBugReport() {
    const modal = await this.modalController.create({
      presentingElement: await this.modalController.getTop(),
      canDismiss: true,
      component: BugReportComponent,
      componentProps: {
        rootPage: AppComponent,
      },
    });

    modal.present();
  }

  public async login(credentials: [string, string]) {
    this.User = await GoBridge.Login({username: credentials[0], password: credentials[1]});
    this.updateUserCanUseSPNValue(this.User);
    console.log("User: ", JSON.stringify(this.User));
  }

  public async logout() {
    await GoBridge.DisableTunnel();
    await GoBridge.DisableSPN();
    var result = await GoBridge.Logout();
    if(result?.error) {
      console.log("failed to logout: ", result.error);
    }
    this.User = null;
  }

  public async onWelcomeScreenExit() {
    this.ShowWelcomeScreen = false;
  }

  public async updateUserInfo() {
    this.User = await GoBridge.UpdateUserInfo();
    this.updateUserCanUseSPNValue(this.User);
    console.log("User: ", JSON.stringify(this.User));
  }

  public async exportDebugInfo() {
    await GoBridge.GetDebugInfoFile();
  }

  private updateUserCanUseSPNValue(user: User) {
    user.canUseSPN = user.current_plan?.feature_ids.includes('spn');
  }
}
