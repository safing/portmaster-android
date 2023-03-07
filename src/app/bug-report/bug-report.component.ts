import { Component, OnInit } from '@angular/core';
import { tick } from '@angular/core/testing';
import { AlertController, ModalController } from '@ionic/angular';
import GoBridge from '../plugins/go.bridge';
import JavaBridge from '../plugins/java.bridge';
import { TicketRequest } from '../types/issue.types';

@Component({
  selector: 'app-bug-report',
  templateUrl: './bug-report.component.html',
  styleUrls: ['./bug-report.component.scss'],
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

  public isOpen: boolean;

  constructor(private alertController: AlertController, private modalCtrl: ModalController) { }

  ngOnInit() {
    GoBridge.GetDebugInfo().then((result: string) => {
      this.DebugInfo = result;
    });
  }

  public show() {
    this.isOpen = true;
  }

  private onClose() {
    this.isOpen = false;
  }
 
  public githubReport(genUrl: boolean) : Promise<any> {
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
    var result = await this.githubReport(genUrl);

    if(result.error != undefined) {
      this.showMessage("Error", result.error)
    }

    console.log("result:", JSON.stringify(result));

    if(genUrl) {
      await JavaBridge.openUrlInBrowser({url: result.url});
    } else {
      await this.alertController.create({
        header: "Issue Create",
        message: "We successfully created the issue on Github for you. Use the following link to check for updates: ",
        buttons: [{
            text: "Open Link",
            handler: () => {
              JavaBridge.openUrlInBrowser({url: result.url});
            } 
          }]
      }); 
      await alert.present();
      await alert.onDidDismiss();
    }
    this.modalCtrl.dismiss(null)
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
      return
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

    await GoBridge.CreateTicket(debugInfo, JSON.stringify(ticketRequest));
    // if(ticketResult != undefined && ticketResult.error != undefined) {
    //   this.showMessage("Error", ticketResult.error);
    //   return;
    // }

    await this.showMessage("Ticket Created!", "");
    this.modalCtrl.dismiss(null)
  }

  async showMessage(title: string, message: string) {
    const alert = await this.alertController.create({
        header: title,
        message: message,
        buttons: [ "Ok" ]
      }); 
    await alert.present()
  }
}