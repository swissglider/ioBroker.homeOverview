import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { bindCallback} from 'rxjs';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

import {IOBrokerConnection} from '../lib/ioBrokerConnection';

const namespace = 'homeOverview.0';
const url = 'http://192.168.90.1:8082'; // user in app.module to connect the socket
export const config: SocketIoConfig = { url, options: {
  query:                          'key=',
  reconnectionDelay:              10000,
  reconnectionAttempts:           Infinity,
  reconnection:                   true,
  forceNew:                       true,
  transports:                     ['websocket']
} };

@Injectable({
  providedIn: 'root'
})

export class IobrokerService {

  private servConn: IOBrokerConnection;

  private isConnected$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  private updatedState$: Subject<[string, any]> = new BehaviorSubject<[string, any]>([null, null]);
  private updatedObject$: Subject<[string, any]> = new BehaviorSubject<[string, any]>([null, null]);
  private newError$: Subject<string> = new BehaviorSubject<string>(null);
  private liveHost$: Subject<string> = new BehaviorSubject<string>('');

  constructor(private socket: Socket) {
    this.servConn = new IOBrokerConnection(namespace, this.socket);
    this.servConn.init({
      onObjectChange: (id, obj)=> {
        this.updatedObject$.next([id, obj]);
      },
      onConnChange: (isConnected) => {
        this.isConnected$.next(isConnected);
      },
      onStateChange: (id, state) => {
        this.updatedState$.next([id, state]);
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
        this.newError$.next(err);
      },
    }, true);
  }

  public getObjectTree(): Subject < string > {
    console.log('Service: getObjectTree');
    return new BehaviorSubject< string >('ioBroker');
  }

  public getLiveHost(){
    const waitConnected = () => {
      if (!this.servConn.getIsConnected()) {
        setTimeout(waitConnected, 50);
      } else {
        this.servConn.getLiveHost((hostName) => {
          this.liveHost$.next(hostName);
        })
      }
    };
    waitConnected();
    return this.liveHost$;
  }

  public getIsConnected(): Subject < boolean > {
    // console.log(this.result1);
    return this.isConnected$;
    // return this.socket.fromEvent('connect');
  }

  public getUpdatedState(): Subject<[string, any]>  {
    return this.updatedState$;
    // return new Observable< any >(observer => {
    //   this.socket.on('stateChange', (id, state) => observer.next([id, state]));
    // });

  }

  public getUpdatedObject(): Subject<[string, any]>  {
    return this.updatedObject$;
  }

  // returns a promise with an object of id:state
  public getStates(ids) {
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
  public getObjects() {
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
  public getEnums() {
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
  public getConfig() {
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

  public getNewError(): Subject<string>  {
    return this.newError$;
  }

  public setState(id, value): void {
    this.servConn.setState(id, value, (err) => {});
  }
}
