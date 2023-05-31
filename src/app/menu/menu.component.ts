import { Component, EnvironmentInjector, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule ]
})
export class MenuComponent {
  constructor(private router: Router) {}


  openVPNSettings(): void {
    this.router.navigate(["/menu/vpn-settings"]);
  }

  openBugReport(): void {
    this.router.navigate(["/menu/bug-report"]);
  }
  
}
