import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable, of } from 'rxjs';
import { bindCallback} from 'rxjs';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

import {IOBrokerConnection} from '../lib/ioBrokerConnection';

export const namespace = 'homeOverview.0';
export const url = 'http://192.168.90.1:8082'; // user in app.module to connect the socket
export const config: SocketIoConfig = { url, options: {
  query:                          'key=',
  reconnectionDelay:              10000,
  reconnectionAttempts:           Infinity,
  reconnection:                   true,
  forceNew:                       true
} };

@Injectable({
  providedIn: 'root'
})

export class IobrokerService {

  private servConn: IOBrokerConnection;

  private isConnected: Subject<boolean> = new BehaviorSubject<boolean>(false);
  private updatedState: Subject<[any, any]> = new BehaviorSubject<[any, any]>([null, null]);
  private updatedObject: Subject<[any, any]> = new BehaviorSubject<[any, any]>([null, null]);
  private newError: Subject<[string]> = new BehaviorSubject<[string]>(null);

  constructor(private socket: Socket) {
    this.servConn = new IOBrokerConnection(namespace, this.socket);
    this.servConn.init({
      onObjectChange: (id, obj) => {
        this.updatedObject.next([id, obj]);
      },
      onConnChange: (isConnected) => {
        this.isConnected.next(isConnected);
      },
      onStateChange: (id, state) => {
        this.updatedState.next([id, state]);
      },
      onRefresh: () => {
        console.log('ioBrokerConnection:onRefresh');
      },
      onAuth: () => {
        console.log('ioBrokerConnection:onAuth');
      },
      onCommand: (instance, command, data) => {
        console.log('ioBrokerConnection:onCommand');
      },
      onError: (err) => {
        console.error('ioBrokerConnection:onError');
        this.newError.next(err);
      },
    }, true);
  }

  getObjectTree(): Observable < string > {
    console.log('Service: getObjectTree');
    return of('ioBroker');
  }

  getIsConnected(): Observable < any > {
    // console.log(this.result1);
    return this.isConnected;
    // return this.socket.fromEvent('connect');
  }

  getUpdatedState(): Observable < any > {
    return this.updatedState;
    // return new Observable< any >(observer => {
    //   this.socket.on('stateChange', (id, state) => observer.next([id, state]));
    // });

  }

  getUpdatedObject(): Observable < any > {
    return this.updatedObject;
  }

  // returns a promise with an object of id:state
  getStates(ids) {
    return new Promise((resolve, reject) => {
      const waitConnected = () => {
        if (!this.servConn.getIsConnected()) {
          setTimeout(waitConnected, 50);
        } else {
          this.servConn.getStates(ids, (err, data) => {
            if (err) { reject(err); }
            resolve(data);
          });
        }
      };
      waitConnected();
    });
  }

  // returns a promise with an object of id:object
  getObjects() {
    return new Promise((resolve, reject) => {
      const waitConnected = () => {
        if (!this.servConn.getIsConnected()) {
          setTimeout(waitConnected, 50);
        } else {
          this.servConn.getObjects((err, data) => {
            if (err) { reject(err); }
            resolve(data);
          });
        }
      };
      waitConnected();
    });
  }

  // returns a promise with an object of id:enum
  getEnums() {
    return new Promise((resolve, reject) => {
      const waitConnected = () => {
        if (!this.servConn.getIsConnected()) {
          setTimeout(waitConnected, 50);
        } else {
          this.servConn.getEnums('', (err, data) => {
            if (err) { reject(err); }
            resolve(data);
          });
        }
      };
      waitConnected();
    });
  }

  // returns a promise with an configs of id:config
  getConfig() {
    return new Promise((resolve, reject) => {
      const waitConnected = () => {
        if (!this.servConn.getIsConnected()) {
          setTimeout(waitConnected, 50);
        } else {
          this.servConn.getConfig((err, data) => {
            if (err) { reject(err); }
            resolve(data);
          });
        }
      };
      waitConnected();
    });
  }

  getNewError(): Observable < any > {
    return this.newError;
  }

  setState(id, value): void {
    this.servConn.setState(id, value, (err) => {});
  }
}
