import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BrowserModule } from '@angular/platform-browser'

import { LogsComponent } from './logs.component';

@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule, BrowserModule],
  declarations: [LogsComponent],
  exports: [LogsComponent]
})
export class LogsModule {}
