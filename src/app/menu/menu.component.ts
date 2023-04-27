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
import GoBridge from '../plugins/go.bridge';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule ]
})
export class MenuComponent {
  constructor(private router: Router) {}


  openVPNSettings() {
    this.router.navigate(["/menu/vpn-settings"]);
  }

  openBugReport() {
    this.router.navigate(["/menu/bug-report"]);
  }
  
}
