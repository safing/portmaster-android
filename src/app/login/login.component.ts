import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import {Credentials, User} from "../types/spn.types"

@Component({
  selector: 'app-login-container',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  @Input() User: User
  @Output() onLogin = new EventEmitter<Credentials>();

  Username: string
  Password: string

  ShowPassword: boolean
  PasswordFieldType: "text" | "password"

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
