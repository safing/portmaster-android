import { Component, Input, Output, EventEmitter } from '@angular/core';

import { CommonModule, LocationStrategy } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SPNService } from '../services/spn.service';


@Component({
  selector: 'app-login-container',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginComponent {
  // @Input() User: UserProfile | null;
  Error: string;
  // @Output() onLogin = new EventEmitter<[string, string]>();

  Username: string
  Password: string

  ShowPassword: boolean
  PasswordFieldType: "password" | "text";

  constructor(private spnService: SPNService, private location: LocationStrategy) { 
    this.PasswordFieldType = "password";
  }

  async login(): Promise<void> {
    this.spnService.login({username: this.Username, password: this.Password}).subscribe(
      _ => {
        this.location.back();
      },
      err => {
        this.Error = err;
      },
    );
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
