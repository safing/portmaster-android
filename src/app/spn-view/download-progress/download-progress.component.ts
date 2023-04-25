import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import GoBridge, { GoInterface } from 'src/app/plugins/go.bridge';
import { SPNService } from 'src/app/services/spn.service';
import { UpdateState, UserProfile } from 'src/app/types/spn.types';

@Component({
  selector: 'app-download-progress',
  templateUrl: './download-progress.component.html',
  styleUrls: ['./download-progress.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DownloadProgressComponent implements OnInit, OnDestroy {

  private readonly EventID = "downloader-progress";
  private Listener: PluginListenerHandle;

  Update: UpdateState = new UpdateState();

  @Output() OnDownloadComplete = new EventEmitter();

  constructor(private changeDetector: ChangeDetectorRef) { }
 
  async ngOnInit() {
    this.Listener = await GoInterface.addListener(this.EventID, (update: any) => {
      console.log("update:", JSON.stringify(update))
      if(this.Update.State == "downloading" && update.State == "up-to-date") {
        this.OnDownloadComplete.emit(null);
      }
      this.Update = update;
      this.changeDetector.detectChanges();
    });

    GoBridge.SubscribeToUpdater({eventID: this.EventID}) 
  }
  
  ngOnDestroy(): void {
    this.Listener.remove()
    GoBridge.UnsubscribeFromUpdater();
  }

  downloadNow() {
    GoBridge.DownloadPendingUpdates();
  }

  downloadOnWifi() {
    GoBridge.DownloadUpdatesOnWifiConnected();
  }
}
