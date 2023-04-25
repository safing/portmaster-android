import { Component, Input, Output, EventEmitter } from '@angular/core';

import { CommonModule, LocationStrategy } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SPNService } from '../services/spn.service';


@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HelpComponent {
  
}
