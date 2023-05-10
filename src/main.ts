import '@angular/compiler'
import { Provider, enableProdMode, importProvidersFrom } from '@angular/core';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
// import { PORTMASTER_HTTP_API_ENDPOINT, PORTMASTER_WS_API_ENDPOINT, PortapiService, SPNService } from '@safing/portmaster-api';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { HttpGoBackend } from './app/services/http.backend';
// import { WebsocketService } from '@safing/portmaster-api';
import { WebsocketGoService } from './app/services/websocket.service';
import { WebsocketService } from './app/lib/websocket.service';
import { PORTMASTER_HTTP_API_ENDPOINT, PORTMASTER_WS_API_ENDPOINT, PortapiService } from './app/lib/portapi.service';
import { SPNService } from './app/lib/spn.service';
import { ConfigService } from './app/lib/config.service';
import { NotificationsService } from './app/services/notifications.service';
// import { PORTMASTER_HTTP_API_ENDPOINT, PORTMASTER_WS_API_ENDPOINT, PortapiService } from './app/services/portapi.service';
// import { SPNService } from './app/services/spn.service';

if (environment.production) {
  enableProdMode();
}

export function provideHttpGoClient(): Provider[] {
  const providers: Provider[] = [
    HttpClient,
    {provide: HttpHandler, useClass: HttpGoBackend},
  ];

  return providers;
}

bootstrapApplication(AppComponent, {
  providers: [
    BrowserModule,
    // WebsocketService,
    {provide: WebsocketService, useClass: WebsocketGoService },
    PortapiService,
    SPNService,
    NotificationsService,
    ConfigService,
    provideHttpGoClient(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(IonicModule.forRoot({})),
    provideRouter(routes),
    {provide: PORTMASTER_HTTP_API_ENDPOINT, useValue: 'internal:'},
    {provide: PORTMASTER_WS_API_ENDPOINT, useValue: 'ws://localhost:9999/api/database/v1'}
  ],
});
