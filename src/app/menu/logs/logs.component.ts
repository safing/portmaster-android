import { Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import GoBridge from '../../plugins/go.bridge';
import { CommonModule, LocationStrategy, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInfiniteScrollContent, IonicModule } from '@ionic/angular';

class LogLine {
  Meta: string
  Content: string
  Severity: string
  ID: number
}

@Component({
  selector: 'app-logs',
  standalone: true,
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LogsComponent implements OnInit, OnDestroy {
  private Timer: any;
  
  @ViewChild('content') content : IonContent;
  Logs: LogLine[];
  
  constructor(private location: LocationStrategy) {}

  ngOnInit(): void {
      // Request the full log buffer.
      GoBridge.GetLogs(0).then((logs: any) => {
        this.Logs = logs;
        
        if(this.content != undefined) {
          this.content.scrollToBottom();
        }
        this.logUpdater();
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.Timer);
  }

  public logUpdater() {
    this.Timer = setInterval(async () => {
        var ID = 0;
        if (this.Logs != null && this.Logs.length > 0) {
          ID = this.Logs[this.Logs.length - 1].ID;
        }

        // Request updates of the log buffer
        var logs = await GoBridge.GetLogs(ID);
        if (logs != null) {
          this.Logs = this.Logs.concat(logs);
          if (logs.length > 0) {
            this.content.scrollToBottom(200);
          }
        }
      }, 1000)
  }

  Close() {
    this.location.back()
  }
}
