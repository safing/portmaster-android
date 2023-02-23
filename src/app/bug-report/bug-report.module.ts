import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';

import { BugReportComponent } from './bug-report.component';

@NgModule({
  imports: [
    CommonModule, FormsModule, IonicModule, BrowserModule, HttpClientModule
  ],
  declarations: [BugReportComponent],
  exports: [BugReportComponent]
})
export class BugReportModule { }
