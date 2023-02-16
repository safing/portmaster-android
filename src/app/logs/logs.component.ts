import { Component, OnInit, ViewChild } from '@angular/core';
import GoBridge from '../plugins/go.bridge';

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
export class LogsComponent implements OnInit {
  Logs: LogLine[];
  Update: boolean;
  @ViewChild('content') private content: any;
  
  constructor() {}

  async ngOnInit() {
    var data = {ID: 0};
    var result = await GoBridge.GetLogs(data);
    this.Logs = result.logs;

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
      var data = {ID: ID};
      var result = await GoBridge.GetLogs(data);
      if(result.logs != null) {
        this.Logs = this.Logs.concat(result.logs);
        if(result.logs.length > 0) {
          this.content.scrollToBottom(200);
        }
      }
    }
  }

  private async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
