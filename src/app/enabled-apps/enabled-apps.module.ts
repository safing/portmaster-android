import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

import { IonicModule } from '@ionic/angular';

import { BrowserModule } from '@angular/platform-browser'

import { EnabledAppsComponent } from './enabled-apps.component';
import { SystemAppList } from './enabled-apps.filter';

@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule, BrowserModule],
  declarations: [EnabledAppsComponent, SystemAppList],
  exports: [EnabledAppsComponent]
})
export class EnabledAppsModule {}
