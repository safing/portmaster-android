import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { Inject, Injectable, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { filter, map, multicast, refCount } from "rxjs/operators";
import { SPNStatus, UserProfile } from "../types/spn.types";
import GoBridge from "../plugins/go.bridge";
import { from } from 'rxjs';
import { Database, DatabaseListener } from "../db-interface/module";


@Injectable({ providedIn: 'root' })
export class SPNService {

  private SPNStatusSubject = new BehaviorSubject<SPNStatus | null>(null);
  private UserProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  

  constructor() {
    Database.Subscribe('runtime:spn/status', (status: SPNStatus) => {
      console.log("runtime:spn/status : ", status)
      this.SPNStatusSubject.next(status);
    });

    Database.Subscribe('core:spn/account/user', (user: UserProfile) => {
      console.log("core:spn/account/user : ", user)
      this.UserProfileSubject.next(user);
    });

    this.userProfile().then((user: UserProfile) => {
      this.UserProfileSubject.next(user);
    });
  }

  /**
   * Encodes a unicode string to base64.
   * See https://developer.mozilla.org/en-US/docs/Web/API/btoa
   * and https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
   */
  b64EncodeUnicode(str: string): string {
    return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
    }))
  }

  /**
   *  Logs into the SPN user account
   */
  login({ username, password }: { username: string, password: string }): Observable<UserProfile> {
    let promise = GoBridge.Login({username: username, password: password});
    return from(promise);
  }

  /**
   * Log out of the SPN user account
   *
   * @param purge Whether or not the portmaster should keep user/device information for the next login
   */
  logout(purge = false): Observable<void> {
    let promise = GoBridge.Logout();
    return from(promise);
  }

  /**
   * Returns the current SPN user profile.
   *
   * @param refresh Whether or not the user profile should be refreshed from the ticket agent
   * @returns
   */
  userProfile(refresh = false): Promise<UserProfile> {
    if(refresh) {
      let promise = GoBridge.UpdateUserInfo();
      return promise;
    }

    let promise = GoBridge.GetUser();
    return promise;
  }

   /**
   * Returns the current SPN user profile.
   *
   * @param refresh Whether or not the user profile should be refreshed from the ticket agent
   * @returns
   */
  spnStatus(): Observable<SPNStatus> {
    return from(GoBridge.GetSPNStatus());
  }

  /**
   * Watches the user profile. It will emit null if there is no profile available yet.
   */
  watchProfile(): Observable<UserProfile | null> {
    return this.UserProfileSubject.asObservable();
  }

  /**
   * Watches the spn status. It will emit null if there is no profile available yet.
   */
  watchSPNStatus(): Observable<SPNStatus | null> {
    return this.SPNStatusSubject.asObservable();
  }
}
