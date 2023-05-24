import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
// import { UserProfile } from '../../types/spn.types';
import { CommonModule, LocationStrategy } from '@angular/common';
import { UserProfile } from 'src/app/lib/spn.types';
import { SPNService } from 'src/app/lib/spn.service';
// import { UserProfile } from '@safing/portmaster-api';
// import { SPNService } from '@safing/portmaster-api/src/lib/spn.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class UserInfoComponent implements OnInit {

  User: UserProfile;
  
  constructor(
    private spnService: SPNService, 
    private location: LocationStrategy) {
    
  }

  ngOnInit() {
    this.spnService.watchProfile().subscribe((user) => {
      this.User = user;
    });

    this.spnService.userProfile(true).subscribe((user: UserProfile) => {
      this.User = user;
    });
  }

  refresh() {
    this.spnService.userProfile(true).subscribe((user: UserProfile) => {
      this.User = user;
    });
  }

  public logout() {
    this.spnService.logout(true).subscribe(() => {
      this.User = null;
      this.location.back();
    });
  }
}
