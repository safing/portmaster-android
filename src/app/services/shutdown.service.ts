import { Injectable } from "@angular/core";
import { AlertController, LoadingController } from "@ionic/angular";
import GoBridge from "../plugins/go.bridge";

@Injectable({
  providedIn: 'root'
})
export class ShutdownService {

  constructor(private loadingCtrl: LoadingController,
    private alertController: AlertController,) { }

  public promptShutdown() {
    this.shutdown("Shutting Down Portmaster", "Shutting down the Portmaster will stop all Portmaster components and will leave your system unprotected!");
  }

  public promptRestart() {
    this.shutdown("Shutting Down Portmaster", "Restart is requierd for the changes to take effect. You have to manually start portmaster after that.");
  }

  public shutdown(header: string, message: string) {
    this.alertController.create({
      header: header,
      message: message,
      buttons: [
        {
          text: "Shutdown",
          handler: () => {
            this.showShutdownOverlay();
            GoBridge.Shutdown();
          }
        },
        {
          text: "Cancel",
        }]
    }).then((alert) => {
      alert.present();
    });
  }

  private showShutdownOverlay() {
    this.loadingCtrl.create({
      message: 'Shuting down...',
      duration: 0,
      spinner: 'circular',
    }).then((loading) => {
      loading.present();
    });
  }

}