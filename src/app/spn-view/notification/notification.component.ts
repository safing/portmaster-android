import { Component, EventEmitter, Input, Output } from "@angular/core";

import { CommonModule } from "@angular/common";
import { AlertController, IonicModule } from "@ionic/angular";
import { Notification, getNotificationTypeString } from "src/app/services/notifications.types";

@Component({
  selector: "notification",
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class NotificationComponent {

  @Input()
  notification: Notification;

  constructor(private alertController: AlertController) { }

  open() {
    this.alertController.create({
      header: this.notification.Title,
      subHeader: getNotificationTypeString(this.notification.Type),
      message: this.notification.Message,
      buttons: ['Close'],
    }).then((alert) => {
      alert.present();
    });
  }
}