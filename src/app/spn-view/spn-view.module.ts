import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SPNViewComponent } from './spn-view.component';

@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule],
  declarations: [SPNViewComponent],
  exports: [SPNViewComponent]
})
export class SPNViewComponentModule {}
