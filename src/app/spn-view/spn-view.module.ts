import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SPNViewComponent } from './spn-view.component';
import { SPNButton } from './spn-button/spn-button.component';
import { DownloadProgressComponent } from './download-progress/download-progress.component';


@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule],
  declarations: [SPNViewComponent, SPNButton, DownloadProgressComponent],
  exports: [SPNViewComponent]
})
export class SPNViewComponentModule {}
