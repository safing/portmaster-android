import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BrowserModule } from '@angular/platform-browser'

import { EnabledAppsComponent } from './enabled-apps.component';

@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule, BrowserModule],
  declarations: [EnabledAppsComponent],
  exports: [EnabledAppsComponent]
})
export class EnabledAppsModule {}
