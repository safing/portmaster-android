import { Component } from '@angular/core';

import { EnabledAppsComponent } from './enabled-apps/enabled-apps.component';
import { ModalController, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private modalController: ModalController) {}

  appList: string[] = ['Apple', 'Orange', 'Banana'];


  async openAppList() {
    const modal = await this.modalController.create({
      presentingElement: await this.modalController.getTop(),
      canDismiss: true,
      component: EnabledAppsComponent,
      componentProps: {
        rootPage: AppComponent,
      },
    });

    await modal.present();
  }
}
