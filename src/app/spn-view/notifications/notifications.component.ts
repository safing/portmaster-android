import { ChangeDetectorRef, Component, OnInit } from "@angular/core";

import { CommonModule } from "@angular/common";
import { AlertButton, AlertController, IonicModule } from "@ionic/angular";
import { Action, Notification, NotificationType, getNotificationTypeString } from "src/app/services/notifications.types";
import { NotificationsService } from "src/app/services/notifications.service";

@Component({
  selector: "notifications",
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class NotificationComponent implements OnInit {
  readonly types = NotificationType;

  notifications: Notification[];
  
  constructor(
    private notificationService: NotificationsService,
    private alertController: AlertController,
    private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.notificationService.new$
    .subscribe((notifications: Notification[]): void => {
      console.log("Notifications:", JSON.stringify(notifications));
      this.notifications = notifications;
      this.changeDetector.detectChanges();
    });
  }

  open(notification: Notification): void {
    if(!notification.AvailableActions) {
      return;
    }

    let buttons: AlertButton[] = [];
    
    notification.AvailableActions.forEach((action: Action): void => {
      buttons.push({
        text: action.Text,
        handler: (): void => {
          this.performAction(notification, action);
        }
      });
    });

    this.alertController.create({
      header: notification.Title,
      subHeader: getNotificationTypeString(notification.Type),
      message: notification.Message,
      buttons: buttons,
    }).then((alert) => {
      alert.present();
    });
  }

  performAction(notification: Notification, action: Action): void {
    this.notificationService.execute(notification, action).subscribe();
  }
}
