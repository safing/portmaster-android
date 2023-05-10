import { Component, Input, Output, EventEmitter } from '@angular/core';

import { CommonModule, LocationStrategy } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SPNService } from '../lib/spn.service';
// import { SPNService } from '@safing/portmaster-api/src/lib/spn.service';


@Component({
  selector: 'app-login-container',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginComponent {
  Error: string;
  
  Username: string
  Password: string

  ShowPassword: boolean
  PasswordFieldType: "password" | "text";

  constructor(
    private spnService: SPNService, 
    private location: LocationStrategy) { 
    this.PasswordFieldType = "password";
  }

  login() {
    this.spnService.login({username: this.Username, password: this.Password})
    .subscribe(
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
