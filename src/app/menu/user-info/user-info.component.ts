import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserProfile } from '../../types/spn.types';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SPNService } from 'src/app/services/spn.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class UserInfoComponent implements OnInit {

  User: UserProfile;
  
  constructor(private spnService: SPNService) {
    this.spnService.watchProfile().subscribe((user) => {
      this.User = user;
    });
  }

  ngOnInit() {}

  refresh() {
    this.spnService.userProfile(true);
  }

  public logout() {
    this.spnService.logout();
  }
}
