import { Component, Input, Output, EventEmitter } from '@angular/core';

import { CommonModule, LocationStrategy } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import GoBridge from '../plugins/go.bridge';


@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HelpComponent {

  constructor(private router: Router) {}

  openBugReport() {
    this.router.navigate(["/menu/bug-report"]);
  }

  openVPNSettings() {
    this.router.navigate(["/menu/vpn-settings"]);
  }

  openLogs() {
    this.router.navigate(["/menu/logs"]);
  }

  openEnabledApps() {
    this.router.navigate(["/menu/enabled-apps"]);
  }

  exportDebugInfo() {
    GoBridge.GetDebugInfoFile();
  }
  
}
