import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ConfigService } from '../lib/config.service';
import { Setting } from '../lib/config.types';
import { Subscription } from 'rxjs';
import { ConfigSettingsViewComponent } from './setting/config-settings';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ConfigSettingsViewComponent ]
})
export class SettingsComponent implements OnInit {

  settings: Setting[] = new Array();

  /** Subscription to watch all available settings. */
  private subscription = Subscription.EMPTY;

  constructor(private configService: ConfigService,
              private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.subscription = new Subscription();
    this.loadSettings();
  }

  private loadSettings() {
    const configSub = this.configService.query('')
      .subscribe(settings => {
        this.settings = settings;
        console.log("Settings: ", JSON.stringify(settings));
        this.changeDetector.detectChanges();
      });
    this.subscription.add(configSub);
  }
}
