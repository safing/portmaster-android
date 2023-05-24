import { Component, EnvironmentInjector, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { CommonModule, LocationStrategy } from '@angular/common';

import JavaBridge from './plugins/java.bridge';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AppComponent implements OnInit, OnDestroy {

  public environmentInjector = inject(EnvironmentInjector);

  constructor(private platform: Platform, private router: Router, private locationStrategy: LocationStrategy) {}

  async ngOnInit(): Promise<void> {
    var welcomeScreen = await JavaBridge.shouldShowWelcomeScreen();

    if(welcomeScreen.show) {
      this.router.navigate(["/welcome"]);
    }

    this.platform.backButton.subscribeWithPriority(10, () => {
      this.locationStrategy.back()
    });
  }

  ngOnDestroy(): void {}
}
