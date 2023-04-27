import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { combineLatest, Subject } from "rxjs";
import { SecurityLevel } from "src/app/types/core.types";



interface SecurityOption {
  level: SecurityLevel;
  displayText: string;
  class: string;
  subText?: string;
}

@Component({
  selector: 'app-security-lock',
  standalone: true,
  templateUrl: './security-lock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./security-lock.scss'],
  imports: [CommonModule]

})
export class SecurityLockComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  lockLevel: SecurityOption | null = null;

  /** The display mode for the security lock */
  // @Input()
  mode: 'small' | 'full' = 'full'

  constructor(
    private cdr: ChangeDetectorRef,
  ) {
    this.SetSecure();
  }

  SetSecure() {
    this.lockLevel = {
      level: SecurityLevel.Normal,
      class: 'text-green-300',
      displayText: 'Secure',
    }
  }

  SetWarning() {    
    this.lockLevel = {
      level: SecurityLevel.High,
      class: 'text-yellow-300',
      displayText: 'Warning'
    }
  }
     
  SetError() {
    this.lockLevel = {
      level: SecurityLevel.Extreme,
      class: 'text-red-300',
      displayText: 'Insecure'
    }
  }


  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }
}
