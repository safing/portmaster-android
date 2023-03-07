import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { LoginModule } from './login/login.module';
import { SPNViewComponentModule } from './spn-view/spn-view.module';
import { WelcomeModule } from './welcome/welcome.module';
import { UserInfoComponent } from './menu/user-info/user-info.component';
import { BugReportComponent } from './menu/bug-report/bug-report.component';
import { EnabledAppsComponent } from './menu/enabled-apps/enabled-apps.component';
import { SystemAppList } from './menu/enabled-apps/enabled-apps.filter';
import { LogsComponent } from './menu/logs/logs.component';

@NgModule({
  declarations: [AppComponent, UserInfoComponent, BugReportComponent, EnabledAppsComponent, SystemAppList, LogsComponent],
  imports: [BrowserModule,
    IonicModule.forRoot(), 
    FormsModule,
    CommonModule,
    SPNViewComponentModule,
    LoginModule,
    WelcomeModule, 
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
