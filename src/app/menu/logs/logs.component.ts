import { Component, OnInit, ViewChild } from '@angular/core';
import GoBridge from '../../plugins/go.bridge';
import { MenuItem } from '../menu.item';

class LogLine {
  Meta: string
  Content: string
  Severity: string
  ID: number
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})
export class LogsComponent extends MenuItem implements OnInit {
  private Logs: LogLine[];
  private Update: boolean;
  @ViewChild('content') private content: any;
  
  constructor() {
    super()
  }

  async ngOnInit() {
    this.Logs = await GoBridge.GetLogs(0);

    this.Update = true;
    this.content.scrollToBottom();
    this.logUpdater();
  }

  public async ngOnDestroy() {
    this.Update = false;
  }

  public async logUpdater() {
    while(this.Update) {
      await this.sleep(1000);
      var ID = 0;
      if(this.Logs != null && this.Logs.length > 0) {
        ID = this.Logs[this.Logs.length - 1].ID;
      }
      var logs = await GoBridge.GetLogs(ID);
      if(logs != null) {
        this.Logs = this.Logs.concat(logs);
        if(logs.length > 0) {
          this.content.scrollToBottom(200);
        }
      }
    }
  }

  private async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
