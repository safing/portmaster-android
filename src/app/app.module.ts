import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EnabledAppsModule } from './enabled-apps/enabled-apps.module';
import { LoginComponentModule } from './login/login.module';
import { SPNViewComponentModule } from './spn-view/spn-view.module';
import { LogsModule } from './logs/logs.module';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CommonModule, IonicModule.forRoot(), EnabledAppsModule, SPNViewComponentModule, LogsModule, LoginComponentModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
