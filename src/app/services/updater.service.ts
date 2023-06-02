import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PortapiService } from '../lib/portapi.service';
import { RegistryState } from './updater.types';

@Injectable({
  providedIn: 'root'
})
export class UpdaterService {

  readonly statusPrefix = "runtime:"
  readonly updatesStateQuery = this.statusPrefix + "core/updates/state"

  /**
   * status$ watches the global core status. It's mutlicasted using a BehaviorSubject so new
   * subscribers will automatically get the latest version while only one subscription
   * to the backend is held.
   */
  constructor(private portapi: PortapiService) { }


  /**
   * Loads the current status of all subsystems matching idPrefix.
   * If idPrefix is an empty string all subsystems are returned.
   *
   * @param idPrefix An optional ID prefix to limit the returned subsystems
   */
  query(): Observable<RegistryState> {
    return this.portapi.query<RegistryState>(this.updatesStateQuery)
      .pipe(
        map(reply => reply.data),
      )
  }

 /**
   * Watches the user profile. It will emit null if there is no profile available yet.
   */
  watchState(): Observable<RegistryState | null> {
    let hasSent = false;
    return this.portapi.watch<RegistryState>(this.updatesStateQuery, {}, { forwardDone: true })
      .pipe(
        filter(result => {
          if ('type' in result && result.type === 'done') {
            if (hasSent) {
              return false;
            }
          }

          return true
        }),
        map(result => {
          hasSent = true;
          if ('type' in result) {
            return null;
          }

          return result;
        })
      );
  } 

}
