import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, ViewChild, AfterViewInit} from "@angular/core";
import { IonInput, IonSelect, IonicModule, ModalController } from "@ionic/angular";
import { BaseSetting, SettingValueType } from "src/app/lib/config.types";

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
  imports: [IonicModule, CommonModule],
})
export class SettingsEditComponent implements AfterViewInit {

  @ViewChild(IonInput) roleInput: IonInput;
  @ViewChild(IonSelect) actionSelect: IonSelect;

  @Input()
  title: string;

  @Input()
  value: Array<String>;

  @Input()
  index: number;

  @Output()
  editCompleted = new EventEmitter<Array<String>>();

  /** Holds annoation for endpoint-lists */
  @Input()
  symbolMap: any;

  constructor(private modalCtrl: ModalController) { }

  ngAfterViewInit(): void {
    if(this.index >= 0) {
      let action = this.value[this.index].trim().charAt(0);
      let role = this.value[this.index].slice(1).trim();
      this.actionSelect.value = action;
      this.roleInput.value = role;
    } else {
      this.actionSelect.value = '-';
    }
  }
  cancel() {
    this.modalCtrl.dismiss(null, 'dismiss');
  }

  confirm() {
    let newValue = this.actionSelect.value + " " + this.roleInput.value;
    if(this.index >= 0) {
      this.value[this.index] = newValue;
    } else {
      this.value.push(newValue);
    }
    this.modalCtrl.dismiss(this.value, 'confirm');
  }
}

