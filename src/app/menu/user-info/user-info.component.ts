import { Component, OnInit } from '@angular/core';
import { CommonModule, LocationStrategy } from '@angular/common';
import { UserProfile } from 'src/app/lib/spn.types';
import { SPNService } from 'src/app/lib/spn.service';

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
    private location: LocationStrategy) { }

  ngOnInit(): void {
    this.spnService.watchProfile().subscribe((user) => {
      console.log("Updated User: ", JSON.stringify(user));
      if (user?.state !== '') {
        this.User = user || null;
      } else {
        this.User = null;
      }
    });
  }

  refresh(): void {
    this.spnService.userProfile(true).subscribe();
  }

  public logout(): void {
    this.spnService.logout(true).subscribe(() => {
      this.User = null;
      this.location.back();
    });
  }
}
