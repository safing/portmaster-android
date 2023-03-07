import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EnabledAppsModule } from './enabled-apps/enabled-apps.module';
import { LoginModule } from './login/login.module';
import { SPNViewComponentModule } from './spn-view/spn-view.module';
import { LogsModule } from './logs/logs.module';
import { WelcomeModule } from './welcome/welcome.module';
import { UserInfoComponent } from './user-info/user-info.component';
import { BugReportComponent } from './bug-report/bug-report.component';

@NgModule({
  declarations: [AppComponent, UserInfoComponent, BugReportComponent],
  imports: [BrowserModule, FormsModule, CommonModule, IonicModule.forRoot(), 
    EnabledAppsModule, 
    SPNViewComponentModule,
    LogsModule,
    LoginModule,
    WelcomeModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
