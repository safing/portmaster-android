import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { UserInfoComponent } from './user-info.component';


@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule],
  declarations: [UserInfoComponent],
  exports: [UserInfoComponent]
})
export class UserInfoModel {}
