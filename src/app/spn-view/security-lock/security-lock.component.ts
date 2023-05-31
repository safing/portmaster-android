import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Subject, combineLatest } from "rxjs";
import { SecurityLevel } from "src/app/lib/core.types";
import { StatusService } from "src/app/services/status.service";
import { FailureStatus, Subsystem } from "src/app/services/status.types";

interface SecurityOption {
  level: SecurityLevel;
  displayText: string;
  class: string;
  subText?: string;
}

@Component({
  selector: 'security-lock',
  standalone: true,
  templateUrl: './security-lock.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./security-lock.component.scss'],
  imports: [CommonModule]

})
export class SecurityLockComponent implements OnInit, OnDestroy {
  lockLevel: SecurityOption | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private statusService: StatusService,
  ) {
    // this.SetSecure();
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
    combineLatest([
      this.statusService.status$,
      this.statusService.watchSubsystems()
    ])
      .subscribe(([status, subsystems]) => {
        const activeLevel = status.ActiveSecurityLevel;
        const suggestedLevel = status.ThreatMitigationLevel;

        // By default the lock is green and we are "Secure"
        this.lockLevel = {
          level: SecurityLevel.Normal,
          class: 'text-green-300',
          displayText: 'Secure',
        }

        // Find the highest failure-status reported by any module
        // of any subsystem.
        const failureStatus = subsystems.reduce((value: FailureStatus, system: Subsystem) => {
          if (system.FailureStatus != 0) {
            console.log(system);
          }
          return system.FailureStatus > value
            ? system.FailureStatus
            : value;
        }, FailureStatus.Operational)

        // update the failure level depending on the  highest
        // failure status.
        switch (failureStatus) {
          case FailureStatus.Warning:
            this.lockLevel = {
              level: SecurityLevel.High,
              class: 'text-yellow-300',
              displayText: 'Warning'
            }
            break;
          case FailureStatus.Error:
            this.lockLevel = {
              level: SecurityLevel.Extreme,
              class: 'text-red-300',
              displayText: 'Insecure'
            }
            break;
        }

        // if the auto-pilot would suggest a higher (mitigation) level
        // we are always Insecure
        if (activeLevel < suggestedLevel) {
          this.lockLevel = {
            level: SecurityLevel.High,
            class: 'high',
            displayText: 'Insecure'
          }
        }

        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {

  }
}
