import { Component, EnvironmentInjector, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { UserInfoComponent } from './user-info/user-info.component';
import { BugReportComponent } from './bug-report/bug-report.component';
import { EnabledAppsComponent } from './enabled-apps/enabled-apps.component';
import { LogsComponent } from './logs/logs.component';
import { VpnSettingsComponent } from './vpn-settings/vpn-settings.component';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../types/spn.types';
import { Router, RouterModule } from '@angular/router';
import { SPNService } from '../services/spn.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule ]
})
export class MenuComponent {
  isOpen: boolean = false;
  User: UserProfile = null;

  constructor(private router: Router, private spnService: SPNService) {
    spnService.watchProfile().subscribe((user) => {
      this.User = user;
    });
  }

  openUserInfo() {
    this.router.navigate(["/menu/user-info"]);
  }

  openEnabledApps() {
    this.router.navigate(["/menu/enabled-apps"]);
  }

  openVPNSettings() {
    this.router.navigate(["/menu/vpn-settings"]);
  }

  openLogs() {
    this.router.navigate(["/menu/logs"]);
  }

  openBugReport() {
    this.router.navigate(["/menu/bug-report"]);
  }

  exportDebugInfo() {
    // this.router.navigate(["/menu/vpn-settings"]);
  }

  logout() {
    this.spnService.logout();
  }
}
