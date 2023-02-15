import { Component, Input, Output, EventEmitter } from '@angular/core';

import {User} from "../types/spn.types"

@Component({
  selector: 'app-login-container',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  @Input() User: User | null;
  @Output() onLogin = new EventEmitter<[String, String]>();

  private Username: string
  private Password: string

  private ShowPassword: boolean
  private PasswordFieldType: "password" | "text";

  constructor() { 
    this.PasswordFieldType = "password";
  }

  async login(): Promise<void> {
    this.onLogin.emit([this.Username, this.Password])
  }

  async togglePasswordVisibility(): Promise<void> {
    this.ShowPassword = !this.ShowPassword;
    if(this.ShowPassword) {
      this.PasswordFieldType = "text";
    } else {
      this.PasswordFieldType = "password";
    }
  }
}
