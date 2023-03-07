import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import GoBridge from '../plugins/go.bridge';
import { User } from '../types/spn.types';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
})
export class UserInfoComponent implements OnInit {

  @Input() User: User;
  @Input() isOpen: boolean;

  @Output() onLogout = new EventEmitter();
  @Output() onRefresh = new EventEmitter();
  
  constructor() {}
  ngOnInit() {
    GoBridge.GetUser().then((user: User) => {
      this.User = user;
    })
  }

  public show() {
    this.isOpen = true;
  }

  private onClose() {
    this.isOpen = false;
  }

  public logout() {
    this.onLogout.emit();
    this.isOpen = false;
  }
}
