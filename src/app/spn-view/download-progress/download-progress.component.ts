import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { UpdateState } from 'src/app/types/spn.types';


@Component({
  selector: 'app-download-progress',
  templateUrl: './download-progress.component.html',
  styleUrls: ['./download-progress.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DownloadProgressComponent implements OnInit, OnDestroy {


  Update: UpdateState = new UpdateState();

  @Output() OnDownloadComplete = new EventEmitter();

  constructor(private changeDetector: ChangeDetectorRef) { }
 
  async ngOnInit() {

  }
  
  ngOnDestroy(): void {
  }
}
