import { Component, OnInit } from '@angular/core';

import { Plugins } from '@capacitor/core';
const { GoBridge } = Plugins;
import { BrowserModule } from '@angular/platform-browser'


@Component({
  selector: 'app-login-container',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {

  Username: string
  Password: string

  constructor() { }

  ngOnInit(): void {
    
  }

  async onLogin(): Promise<void> {
    var credentials = {
      username: this.Username,
      password: this.Password
    }
    
    await GoBridge.login(credentials)
  }

}
