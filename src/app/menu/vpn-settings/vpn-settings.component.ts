import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import JavaBridge from 'src/app/plugins/java.bridge';

@Component({
  selector: 'app-vpn-settings',
  templateUrl: './vpn-settings.component.html',
  styleUrls: ['./vpn-settings.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class VpnSettingsComponent implements OnInit {

  constructor() {}

  ngOnInit() {}

  openSystemVPNSettings() {
    JavaBridge.openVPNSettings();
  }
}
