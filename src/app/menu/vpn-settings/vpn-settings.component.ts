import { Component, OnInit } from '@angular/core';
import JavaBridge from 'src/app/plugins/java.bridge';

@Component({
  selector: 'app-vpn-settings',
  templateUrl: './vpn-settings.component.html',
  styleUrls: ['./vpn-settings.component.scss'],
  standalone: true,
  imports: []
})
export class VpnSettingsComponent implements OnInit {

  constructor() {}

  ngOnInit() {}

  openSystemVPNSettings() {
    JavaBridge.openVPNSettings();
  }
}
