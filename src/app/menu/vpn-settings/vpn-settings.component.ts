import { Component, OnInit } from '@angular/core';
import JavaBridge from 'src/app/plugins/java.bridge';
import { MenuItem } from '../menu.item';

@Component({
  selector: 'app-vpn-settings',
  templateUrl: './vpn-settings.component.html',
  styleUrls: ['./vpn-settings.component.scss'],
})
export class VpnSettingsComponent extends MenuItem implements OnInit {

  constructor() { 
    super();
  }

  ngOnInit() { }

  private openSystemVPNSettings() {
    JavaBridge.openVPNSettings();
  }
}
