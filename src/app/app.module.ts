import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SPNViewComponentModule } from './spn-view/spn-view.module';
import { EnabledAppsComponent } from './enabled-apps/enabled-apps.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CommonModule, IonicModule.forRoot(), AppRoutingModule, SPNViewComponentModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
