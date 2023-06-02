import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import GoBridge from 'src/app/plugins/go.bridge';
import { UpdaterService } from 'src/app/services/updater.service';
import { RegistryState, State } from 'src/app/services/updater.types';


@Component({
  selector: 'app-download-progress',
  templateUrl: './download-progress.component.html',
  styleUrls: ['./download-progress.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DownloadProgressComponent implements OnInit, OnDestroy {
  readonly State = State; 

  Registry: RegistryState;
  HasUpdates: boolean = false;
  Timer: any = null;
  IsOnWifi: boolean = false;
  NewApk: boolean = false;

  WifiDownloadClicked: boolean = false;

  @Output() OnDownloadComplete = new EventEmitter();
  
  constructor(private changeDetector: ChangeDetectorRef, private updaterService: UpdaterService) { }
 
  ngOnInit() {
    this.updaterService.watchState().subscribe((registry: RegistryState) => {
      console.log("Update state:", JSON.stringify(registry));

      if(this.Registry?.ID == State.Downloading && registry.ID === State.Ready) {
        this.OnDownloadComplete.emit();
        clearInterval(this.Timer);
        this.Timer = null;
      }
      
      this.HasUpdates = registry.Updates.PendingDownload?.length > 0;
      this.Registry = registry;
      GoBridge.IsOnWifiNetwork().then((onWifi: boolean) => {
        this.IsOnWifi = onWifi;
      });

      if(this.HasUpdates) {
        this.wifiUpdater();
      }

      GoBridge.NewApkAvaliable().then((newApk: boolean) => {
        this.NewApk = newApk;
      });

      this.changeDetector.detectChanges();
    })
  }
  
  public wifiUpdater() {
    if(this.Timer !== null) {
      return;
    }
    this.Timer = setInterval(() => {
      GoBridge.IsOnWifiNetwork().then((onWifi: boolean) => {
        this.IsOnWifi = onWifi;
        this.changeDetector.detectChanges();
      });
    }, 10000)
  }

  ngOnDestroy(): void {
    clearInterval(this.Timer);
  }
  
  downloadNow(): void {
    GoBridge.DownloadPendingUpdates();
  }

  downloadOnWifi(): void {
    this.WifiDownloadClicked = true;
    GoBridge.DownloadUpdatesOnWifiConnected();
  }
}
