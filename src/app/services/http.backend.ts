/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


// import {HttpDownloadProgressEvent, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaderResponse, HttpJsonParseError, HttpResponse, HttpStatusCode, HttpUploadProgressEvent} from './response';
import { HttpBackend, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import GoBridge from '../plugins/go.bridge';


/**
 * Determine an appropriate URL for the response, by checking either
 * XMLHttpRequest.responseURL or the X-Request-URL header.
 */
function getResponseUrl(xhr: any): string | null {
  if ('responseURL' in xhr && xhr.responseURL) {
    return xhr.responseURL;
  }
  if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
    return xhr.getResponseHeader('X-Request-URL');
  }
  return null;
}

/**
 * Uses `XMLHttpRequest` to send requests to a backend server.
 * @see `HttpHandler`
 * @see `JsonpClientBackend`
 *
 * @publicApi
 */
@Injectable()
export class HttpGoBackend implements HttpBackend {

  constructor() {
    console.log("Initializing HttpGoBackend...");
  }

  /**
   * Processes a request and returns a stream of response events.
   * @param req The request object.
   * @returns An observable of the response events.
   */
  handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    // Observable that will create a fake http request to the Go library.
    const observable = new Observable<HttpEvent<any>>((subscriber) => {
      // Create object that Go library will able to parse.
      var requestJson = {
        url: req.urlWithParams,
        method: req.method,
        body: req.serializeBody(),
        headers: {},
      }

      // Convert headers to map      
      req.headers.keys().forEach((key: string) => {
        requestJson.headers[key] = req.headers.getAll(key);
      });

      // Send request to the go library and wait for a response.
      GoBridge.PerformRequest({ requestJson: JSON.stringify(requestJson) }).then((body: string) => {
        subscriber.next(new HttpResponse<any>({ body: body }));
      }).catch((err: string) => {
        subscriber.error(err);
      }).finally(() => {
        subscriber.complete();
      })
    });

    return observable;
  }
}
