import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ConfigService } from '../lib/config.service';
import { Setting } from '../lib/config.types';
import { Subscription } from 'rxjs';
import { ConfigSettingsViewComponent } from './setting/config-settings';
import { SaveSettingEvent } from './setting/edit/edit.component';
import { ActivatedRoute } from '@angular/router';

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

  /**
   * @private
   * The key of the setting to highligh, if any ...
   */
  highlightSettingKey: string | null = null;

  constructor(private configService: ConfigService,
              private changeDetector: ChangeDetectorRef,
              private route: ActivatedRoute) {}


  ngOnInit() {
    this.subscription = new Subscription();
    this.loadSettings();

    this.route.queryParamMap
      .subscribe(
        params => {
          this.highlightSettingKey = params.get('setting');
          this.changeDetector.detectChanges();
        }
      );
   }

  private loadSettings() {
    const configSub = this.configService.query('')
      .subscribe(settings => {
        this.settings = settings;
        this.changeDetector.detectChanges();
      });
    this.subscription.add(configSub);
  }

  saveSetting(event: SaveSettingEvent) {
    let idx = this.settings.findIndex(setting => setting.Key === event.key);
    if (idx < 0) {
      return;
    }

    const setting = {
      ...this.settings[idx],
    }

    if (event.isDefault) {
      delete (setting['Value']);
    } else {
      setting.Value = event.value;
    }

    this.configService.save(setting)
      .subscribe({
        next: () => {
          if (!!event.accepted) {
            event.accepted();
          }

          this.settings[idx] = setting;

          // copy the settings into a new array so we trigger
          // an input update due to changed array identity.
          this.settings = [...this.settings];

          // for the release level setting we need to
          // to a page-reload since portmaster will now
          // return more settings.
          this.loadSettings();
        },
        error: err => {
          if (!!event.rejected) {
            event.rejected(err);
          }

          console.error(err);
        }
      });
  }
}
