import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserProfile } from '../../types/spn.types';
import { MenuItem } from '../menu.item';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class UserInfoComponent extends MenuItem implements OnInit {

  @Input() User: UserProfile;

  @Output() onLogout = new EventEmitter();
  @Output() onRefresh = new EventEmitter();
  
  constructor() {
    super()
  }
  ngOnInit() {}


  public logout() {
    this.onLogout.emit();
    this.isOpen = false;
  }
}
