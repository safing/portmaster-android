import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import GoBridge from '../../plugins/go.bridge';
import { User } from '../../types/spn.types';
import { MenuItem } from '../menu.item';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
})
export class UserInfoComponent extends MenuItem implements OnInit {

  @Input() User: User;

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
