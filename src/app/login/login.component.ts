import { Component, Input, Output, EventEmitter } from '@angular/core';

import {UserProfile} from "../types/spn.types"
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-container',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginComponent {
  @Input() User: UserProfile | null;
  @Input() Error: string;
  @Output() onLogin = new EventEmitter<[string, string]>();

  Username: string
  Password: string

  ShowPassword: boolean
  PasswordFieldType: "password" | "text";

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
