import { Component, OnInit } from '@angular/core';
import { AlertController, IonicModule, LoadingController, ModalController } from '@ionic/angular';
import GoBridge from '../../plugins/go.bridge';
import JavaBridge from '../../plugins/java.bridge';
import { TicketRequest } from '../../types/issue.types';
import { CommonModule, LocationStrategy } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bug-report',
  templateUrl: './bug-report.component.html',
  styleUrls: ['./bug-report.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class BugReportComponent implements OnInit {
  
  // Title
  public ReportTitle:  string | null;
	
  // Sections
  public WhatHappened: string | null;
	public WhatWasExpected:  string | null;
	public HowToReproduce: string | null;
	public AdditionalInfo: string | null;

  // Debug info, will be uploaded to private bin
  public IncludeDebugInfo: boolean = true;
	public DebugInfo:  string | null;

  constructor(private alertController: AlertController, private loadingCtrl: LoadingController, private locationStrategy: LocationStrategy) {}

  ngOnInit() {
    GoBridge.GetDebugInfo().then((result: string) => {
      this.DebugInfo = result;
    }, (err) => {
      console.log("failed to get debug info:", err);
    });
  }

  private resetForm(): void {
    this.ReportTitle = null;
    this.WhatHappened = null;
    this.WhatWasExpected = null;
    this.HowToReproduce = null;
    this.AdditionalInfo = null;
    this.IncludeDebugInfo = true;
    this.DebugInfo = null;
  }

  public githubReport(genUrl: boolean) : Promise<string> {
    var debugInfo = null;

    if(this.IncludeDebugInfo) {
      debugInfo = this.DebugInfo;
    }

    return GoBridge.CreateIssue(debugInfo, genUrl,
        JSON.stringify({
          title: this.ReportTitle,
          sections: [
            { title: "What happened?", body: this.WhatHappened },
            { title: "What did you expect to happen?", body: this.WhatWasExpected },
            { title: "How did you reproduce it?", body: this.HowToReproduce },
            { title: "Additional information", body: this.AdditionalInfo},
          ],
        }),
      )
  }

  async githubSelectAlert() {
    const alert = await this.alertController.create({
      header: "Create Issue on GitHub",
      message: "You can easily create the issue with your own GitHub account. Or create the GitHub issue privately, but then we will have no way to communicate with you for further information.",
      buttons: [
        {
          role: "with-account",
          text: "Use my account"
        }, 
        {
          role: "no-account",
          text: "Create Without account"
        },
        {
          role: "cancel",
          text: "Cancel"
        }
      ],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    if(role === "cancel") {
      return;
    }

    var genUrl = (role === "with-account");
    try {
      var loadingOverlay = await this.loadingCtrl.create({
        message: 'Loading...',
        duration: 0,
        spinner: 'circular',
      });
      loadingOverlay.present();
      var url = await this.githubReport(genUrl);
      console.log("url:", url);
      loadingOverlay.dismiss();

      if(genUrl) {
        await JavaBridge.openUrlInBrowser({url: url});
      } else {
        const alert = await this.alertController.create({
          header: "Issue Create",
          message: "We successfully created the issue on Github for you. Use the following link to check for updates: ",
          buttons: [{
              text: "Open Link",
              handler: () => {
                JavaBridge.openUrlInBrowser({url: url});
              } 
            }]
        }); 

        await alert.present();
        await alert.onDidDismiss();
      }

      this.resetForm();
      this.locationStrategy.back();
    }catch(err) {
      loadingOverlay.dismiss();
      await this.showMessage("Error", err);
    }
  }

  public async privateTicketReport() {
    const alert = await this.alertController.create({
      header: "How should we stay in touch?",
      message: "Please enter your email address so we can write back and forth until the issue is concluded.",
      inputs: [
          {
            type: "email",
            placeholder: "Optional email",
          }
      ],
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },
        {
          text: "Create Ticket",
        },
      ]
    });
    await alert.present();

    const result = await alert.onDidDismiss();
    if(result.role === "cancel") {
      return;
    }

    var email = result.data.values[0];
    var ticketRequest: TicketRequest = {
      title: this.ReportTitle,
      sections: [
        { title: "What happened?", body: this.WhatHappened },
        { title: "What did you expect to happen?", body: this.WhatWasExpected },
        { title: "How did you reproduce it?", body: this.HowToReproduce },
        { title: "Additional information", body: this.AdditionalInfo},
      ],
      repoName: 'portmaster-android',
      email: email,
    };

    var debugInfo = null;

    if(this.IncludeDebugInfo) {
      debugInfo = this.DebugInfo;
    }
    try {
      var loadingOverlay = await this.loadingCtrl.create({
        message: 'Loading...',
        duration: 0,
        spinner: 'circular',
      });
      loadingOverlay.present();
      await GoBridge.CreateTicket(debugInfo, JSON.stringify(ticketRequest));
      loadingOverlay.dismiss();
      await this.showMessage("Ticket Created!", "");
      // Close the window.
      this.resetForm();
      this.locationStrategy.back();
    } catch (err) {
      loadingOverlay.dismiss();
      this.showMessage("Error", err);
    }
  }

  async showMessage(title: string, message: string) {
    const alert = await this.alertController.create({
        header: title,
        message: message,
        buttons: [ "Ok" ]
      }); 
    await alert.present();
  }
}