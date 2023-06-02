import { BaseSetting, ExpertiseLevelNumber, ExternalOptionHint, OptionType, optionTypeName, QuickSetting, ReleaseLevel, SettingValueType, WellKnown } from "src/app/lib/config.types";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IonAccordionGroup, IonicModule, ItemReorderEventDetail, ModalController } from "@ionic/angular";
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
  action: string,
  rule: string,
}

@Component({
  selector: 'app-generic-setting',
  standalone: true,
  templateUrl: './generic-setting.html',
  exportAs: 'appGenericSetting',
  styleUrls: ['./generic-setting.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule, FormsModule, SettingsEditComponent, ReactiveFormsModule],
})
export class GenericSettingComponent<S extends BaseSetting<any, any>> implements OnInit, OnDestroy, AfterViewInit {
  //
  // Constants used in the template.
  //

  readonly optionHint = ExternalOptionHint;
  readonly expertise = ExpertiseLevelNumber;
  readonly optionType = OptionType;
  readonly releaseLevel = ReleaseLevel;
  readonly wellKnown = WellKnown;

  @ViewChild(IonAccordionGroup) accordion: IonAccordionGroup;
  
  _setting: S = null;
  type: string = '';
  isDefault: boolean = true;
  pendingRestart = false;
  _expand: boolean = false;
  
  @Input()
  set highlightSettingKey(key: string) {
    this._expand = key === this._setting.Key;
    if(this.accordion !== undefined) {
      if(this._expand) {
        this.accordion.value = "element";
      } else {
        this.accordion.value = undefined;
      }
    }
    this.changeDetector.detectChanges();
  }

  /* The currently configured value. Updated by the setting() setter */
  _currentValue: any = null;
  displayValues: Array<DisplayValue>;

  @Input()
  set setting(s: S | null) {
    this._setting = s;
    this.type = optionTypeName(s.OptType);
    if (s.OptType == OptionType.String && !!s.PossibleValues) {
      this.type = 'select';
    }

    if (s.Value !== undefined) {
      this._currentValue = s.Value;
      this.isDefault = s.Value === this.defaultValue;
    } else {
      this._currentValue = this.defaultValue;
      this.isDefault = true;
    }

    this.pendingRestart = !!s.Annotations?.[WellKnown.RestartPending];

    this.updateDisplayValues()
  }

  @Output()
  onValueChanged: EventEmitter<SaveSettingEvent> = new EventEmitter();
  
  /** Returns the symbolMap annoation for endpoint-lists */
  get symbolMap(): Map<String, any> {
    return this._setting?.Annotations[WellKnown.EndpointListVerdictNames] || {
      '+': 'Allow',
      '-': 'Block'
    };
  }

  getSymbolMapValue(id: string) {
    return this.symbolMap[id];
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private modalCtrl: ModalController) { }

 
  ngOnInit() {}

  ngOnDestroy() {}

  ngAfterViewInit(): void {
    if(this.accordion !== undefined) {
      if(this._expand) {
        this.accordion.value = "element";
      } else {
        this.accordion.value = undefined;
      }
    }
    this.changeDetector.detectChanges();
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    // Swap values
    [this._currentValue[ev.detail.from], this._currentValue[ev.detail.to]] = [this._currentValue[ev.detail.to], this._currentValue[ev.detail.from]];
    this.emitChangeEvent();
    ev.detail.complete();
  }

  onToggle(event: any) {
    this._currentValue = event.detail.checked;
    this.emitChangeEvent();
    event.stopPropagation();
  }

  onSelect(event: any) {
    this._currentValue = event.target.value;
    this.emitChangeEvent();
  }

  stopPropagation(event: any) {
    event.stopPropagation();
  }

  onEditDone(value: SettingValueType<S>) {
    this._currentValue = value;
    this.emitChangeEvent();
    this.updateDisplayValues();
  }

  resetToDefault() {
    this._currentValue = undefined;
    this.isDefault = true;
    this.emitChangeEvent();
    this.updateDisplayValues();
    this.changeDetector.detectChanges();
  }
  
  private emitChangeEvent() {
    this.onValueChanged.emit({
      key: this._setting!.Key,
      isDefault: false,
      value: this._currentValue,
      rejected: () => {},
      accepted: () => {}
    });
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

  async onArrayValueClicked(index: number) {
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
    await modal.onWillDismiss();

    this.emitChangeEvent();
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

  get defaultValue() {
    // Stackable options are displayed differently.
    if (this._setting.OptType == OptionType.StringArray) {
      if (this._setting.GlobalDefault === undefined && this._setting.DefaultValue !== null) {
        return this._setting.DefaultValue;
      }
      return [] as SettingValueType<S>;
    }

    // Return global, then default value.
    if (this._setting.GlobalDefault !== undefined) {
      return this._setting.GlobalDefault
    }
    return this._setting.DefaultValue
  }
}
