import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { Plugins } from '@capacitor/core';

import {Credentials, User} from "../models/classes"

@Component({
  selector: 'app-login-container',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  @Input() user: User
  @Output() onLogin = new EventEmitter<Credentials>();

  Username: string
  Password: string

  ShowPassword: boolean
  PasswordFieldType = "password"

  constructor() { }

  async login(): Promise<void> {
    var credentials : Credentials = {
      username: this.Username,
      password: this.Password
    }
    
    this.onLogin.emit(credentials)
  }

  async togglePasswordVisibility() {
    this.ShowPassword = !this.ShowPassword;
    if(this.ShowPassword) {
      this.PasswordFieldType = "text"
    } else {
      this.PasswordFieldType = "password"
    }
  }
}
