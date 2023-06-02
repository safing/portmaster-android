import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnInit, ChangeDetectorRef } from "@angular/core";
import { AlertController, IonInput, IonRadioGroup, IonSelect, IonicModule, ModalController } from "@ionic/angular";
import { MarkdownModule } from "ngx-markdown";
import { BaseSetting, QuickSetting, SettingValueType } from "src/app/lib/config.types";

export interface SaveSettingEvent<S extends BaseSetting<any, any> = any> {
  key: string;
  value: SettingValueType<S>;
  isDefault: boolean;
  rejected?: (err: any) => void
  accepted?: () => void
}

@Component({
  selector: 'app-setting-edit',
  standalone: true,
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  imports: [IonicModule, CommonModule, MarkdownModule],
})
export class SettingsEditComponent implements OnInit, AfterViewInit {

  @ViewChild(IonInput) roleInput: IonInput;
  @ViewChild(IonRadioGroup) actionSelect: IonRadioGroup;

  @Input()
  title: string;

  @Input()
  value: Array<string>;

  @Input()
  index: number;

  @Input()
  help: string;

  @Input()
  quickSettings: QuickSetting<string>;

  @Output()
  editCompleted = new EventEmitter<Array<String>>();

  /** Holds annoation for endpoint-lists */
  @Input()
  symbolMap: any;

  isUpdate: boolean = false;

  constructor(private modalCtrl: ModalController,
    private alertController: AlertController,
    private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.index >= 0) {
      // Updating existing value.
      this.isUpdate = true;
    } else {
      // Adding new value, not updating.
      this.isUpdate = false;
    }
  }

  ngAfterViewInit(): void {
    if (this.index >= 0) {
      this.updateValue(this.value[this.index]);
    } else {
      this.actionSelect.value = '-';
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'dismiss');
  }

  confirm() {
    let newValue = this.actionSelect.value + " " + this.roleInput.value;
    if (this.index >= 0) {
      this.value[this.index] = newValue;
    } else {
      this.value.push(newValue);
    }
    this.modalCtrl.dismiss(this.value, 'confirm');
  }

  updateValue(value: string) {
    let action = value.trim().charAt(0);
    let role = value.slice(1).trim();
    this.actionSelect.value = action;
    this.roleInput.value = role;
  }

  deleteAndClose() {
    this.alertController.create({
      header: "Delete the current entry",
      message: "Are you sure you want to delete the current entry?",
      buttons: [
        {
          text: "Delete",
          handler: () => {
            this.value.splice(this.index, 1);
            this.modalCtrl.dismiss(this.value, 'confirm');
          }
        },
        {
          text: "Cancel",
        }]
    }).then((alert) => {
      alert.present();
    });
  }

  applyQuickSetting(setting: QuickSetting<string>) {
    this.updateValue(setting.Value[0]);
    this.changeDetector.checkNoChanges();
  }
}

