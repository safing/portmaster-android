import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { IonicModule, ItemReorderEventDetail, ModalController } from "@ionic/angular";
import { BaseSetting, ExpertiseLevelNumber, ExternalOptionHint, OptionType, optionTypeName, QuickSetting, ReleaseLevel, SettingValueType, WellKnown } from "src/app/lib/config.types";
import { SettingsEditComponent } from "../edit/edit.component";

export interface SaveSettingEvent<S extends BaseSetting<any, any> = any> {
  key: string;
  value: SettingValueType<S>;
  isDefault: boolean;
  rejected?: (err: any) => void
  accepted?: () => void
}

interface DisplayValue {
  color: string,
  action: String,
  rule: String,
}

@Component({
  selector: 'app-generic-setting',
  standalone: true,
  templateUrl: './generic-setting.html',
  exportAs: 'appGenericSetting',
  styleUrls: ['./generic-setting.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule, SettingsEditComponent],
})
export class GenericSettingComponent<S extends BaseSetting<any, any>> implements OnInit, OnDestroy {
  //
  // Constants used in the template.
  //

  readonly optionHint = ExternalOptionHint;
  readonly expertise = ExpertiseLevelNumber;
  readonly optionType = OptionType;
  readonly releaseLevel = ReleaseLevel;
  readonly wellKnown = WellKnown;

  _setting: S = null;
  type: string = '';

  /* The currently configured value. Updated by the setting() setter */
  _currentValue: SettingValueType<S> | null = null;
  displayValues: Array<DisplayValue>;

  @Input()
  set setting(s: S | null) {
    this._setting = s;
    this.type = optionTypeName(s.OptType);
    if (s.OptType == OptionType.String && !!s.PossibleValues) {
      this.type = 'select';
    }

    this._currentValue = s.DefaultValue;
    this.updateDisplayValues()
  }

  updateDisplayValues() {
    if (this._setting.OptType != OptionType.StringArray) {
      return;
    }
    this.displayValues = new Array<DisplayValue>();
    (this._currentValue as Array<string>).forEach((value: string) => {
      let action = value.trim().charAt(0);
      let rule = value.slice(1).trim();
      let color = "danger";
      if (action == "+") {
        color = "success";
      }
      this.displayValues.push({ color: color, action: action, rule: rule });
    });
    this.changeDetector.detectChanges();
  }

  /** Returns the symbolMap annoation for endpoint-lists */
  get symbolMap() {
    return this._setting?.Annotations[WellKnown.EndpointListVerdictNames] || {
      '+': 'Allow',
      '-': 'Block'
    };
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private modalCtrl: ModalController) { }

  ngOnInit() {
    // this.subscription = this.triggerSave.pipe(
    //   debounceTime(500),
    // ).subscribe(() => this.emitSaveRequest())
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    // The `from` and `to` properties contain the index of the item
    // when the drag started and ended, respectively
    console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);

    // Finish the reorder and position the item in the DOM based on
    // where the gesture ended. This method can also be called directly
    // by the reorder group
    ev.detail.complete();
  }

  onToggle(event: any) {
    event.stopPropagation();
  }

  stopPropagation(event: any) {
    event.stopPropagation();
  }

  async onValueClicked(index: number) {
    console.log(this._setting.Help);
    let modal = await this.modalCtrl.create({
      component: SettingsEditComponent,
      componentProps: {
        title: this._setting.Name,
        value: this._currentValue,
        symbolMap: this.symbolMap,
        index: index,
        help: this._setting.Help,
        quickSettings: this.quickSettings,
      }
    });

    modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      console.log("Data: ", JSON.stringify(data));
    }
    this.updateDisplayValues();
  }

  onEditDone(value: SettingValueType<S>) {
    this._currentValue = value;
    this.updateDisplayValues();
  }

  get quickSettings(): QuickSetting<SettingValueType<S>>[] {
    if (!this._setting || !this._setting.Annotations[WellKnown.QuickSetting]) {
      return [];
    }

    const quickSettings = this._setting.Annotations[WellKnown.QuickSetting]!;

    return Array.isArray(quickSettings)
      ? quickSettings
      : [quickSettings];
  }
}
