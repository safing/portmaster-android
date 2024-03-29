import { Injectable } from '@angular/core';
import { WebSocketSubjectConfig } from 'rxjs/webSocket';
import { AnonymousSubject } from 'rxjs/internal/Subject';
import { Observable, Subscriber } from 'rxjs';
import GoBridge, { GoInterface } from '../plugins/go.bridge';

@Injectable()
export class WebsocketGoService {
  constructor() { }

  /**
   * createConnection creates a new websocket connection using opts.
   *
   * @param opts Options for the websocket connection.
   */
  createConnection<T>(opts: WebSocketSubjectConfig<T>): AnonymousSubject<T> {
    opts.openObserver.next(null);
    
    let source = {
      next: (value: T): void => {
        console.log("Observer: ", opts.serializer(value));
        GoBridge.DatabaseMessage(opts.serializer(value) as string);
      },
      error: (): void => {},
      complete: (): void => {},
    };

    let destination = new Observable<T>((subscriber: Subscriber<T>) => {
      GoInterface.addListener("db_event", (response) => {
        console.log("DB response: ", response.data);
        subscriber.next(opts.deserializer(response));
      });  
      GoBridge.SubscribeToDatabase({});
    });
    
    return new AnonymousSubject<T>(source, destination);
  }
}

