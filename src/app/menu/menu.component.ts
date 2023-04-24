import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UserInfoComponent } from './user-info/user-info.component';
import { BugReportComponent } from './bug-report/bug-report.component';
import { EnabledAppsComponent } from './enabled-apps/enabled-apps.component';
import { LogsComponent } from './logs/logs.component';
import { VpnSettingsComponent } from './vpn-settings/vpn-settings.component';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../types/spn.types';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, VpnSettingsComponent, EnabledAppsComponent, UserInfoComponent, BugReportComponent ]
})
export class MenuComponent {
  isOpen: boolean = false;
  User: UserProfile = null;

  @ViewChild("userinfo") UserInfoModal: UserInfoComponent;
  @ViewChild("bugreport") BugReportModal: BugReportComponent;
  @ViewChild("enabledapps") EnabledAppsModal: EnabledAppsComponent;
  @ViewChild("logs") LogsModal: LogsComponent;
  @ViewChild("vpnsettings") VPNSettings: VpnSettingsComponent;
  
}
