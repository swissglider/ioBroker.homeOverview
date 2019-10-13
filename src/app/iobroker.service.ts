import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { bindCallback} from 'rxjs';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

import {IOBrokerConnection} from '../lib/ioBrokerConnection';
import { Identifiers } from '@angular/compiler';

/** ioBroker adapter namespace */
const namespace = 'homeOverview.0';
/** ioBroker url */
const url = 'http://192.168.90.1:8082'; // user in app.module to connect the socket
/** socket.io connection configuration */
export const config: SocketIoConfig = { url, options: {
  query:                          'key=',
  reconnectionDelay:              10000,
  reconnectionAttempts:           Infinity,
  reconnection:                   true,
  forceNew:                       true,
  transports:                     ['websocket']
} };

/**
 * Handels the connection to the ioBroker with help of the /lib/ioBrokerConnection.ts
 */
@Injectable({
  providedIn: 'root'
})

export class IobrokerService {

  /** connection to ioBroker --> see ioBroker socket.io adapter */
  private servConn: IOBrokerConnection;

  /** observer if the connection is established */
  private isConnected$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  /** current states observer */
  private updatedState$: Subject<[string, any]> = new BehaviorSubject<[string, any]>([null, null]);
  /** current object observer */
  private updatedObject$: Subject<[string, any]> = new BehaviorSubject<[string, any]>([null, null]);
  /** current error observer */
  private newError$: Subject<string> = new BehaviorSubject<string>(null);
  /** current liveHost observer */
  private liveHost$: Subject<string> = new BehaviorSubject<string>('');

  /**
   * init ioBroker connection and listen to some emit callbacks 
   *  - onObjectChange
   *  - onConnChange
   *  - onStateChange
   *  - onRefresh (only console log till now)
   *  - onAuth (only console log till now)
   *  - onCommand (only console log till now)
   *  - onError
   * @param socket 
   */
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

  /** @ignore */
  public getObjectTree(): Subject < string > {
    console.log('Service: getObjectTree');
    return new BehaviorSubject< string >('ioBroker');
  }

  /**
   * Returns the liveHost Name as Observer
   * @returns {Observer} liveHost
   */
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

  /**
   * get connection state observer
   * @returns {Observer} isConnected
   */
  public getIsConnected(): Subject < boolean > {
    // console.log(this.result1);
    return this.isConnected$;
    // return this.socket.fromEvent('connect');
  }

  /**
   * Get an observer for ioBroker state update
   * @returns {Observer<[string, any]> } all state updates
   */
  public getUpdatedState(): Subject<[string, any]>  {
    return this.updatedState$;
    // return new Observable< any >(observer => {
    //   this.socket.on('stateChange', (id, state) => observer.next([id, state]));
    // });

  }

  /**
   * Get an observer for ioBroker object update
   * @returns {Observer<[string, any]> } all object updates
   */
  public getUpdatedObject(): Subject<[string, any]>  {
    return this.updatedObject$;
  }

  /**
   * Returns all states fits the ids filter as Promise
   * @param ids ioBroker id filter
   * @returns {Promise<[id,state]>} with ioBroker states
   */
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

  /**
   * Returns all objects as Promise
   * @returns {Promise<[id,object]>} with ioBroker objects
   */
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

  /**
   * Returns all enums as Promise
   * @returns {Promise<[id, enum]>} with ioBroker enums
   */
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

  /**
   * Returns all configs as Promise
   * @returns {Promise<[id, config]>} with ioBroker configs
   */
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

  /**
   * Returns Error Message Observer
   * @returns {Observer<string>} error Message
   */
  public getNewError(): Subject<string>  {
    return this.newError$;
  }

  /**
   * Sets a ioBroker state
   * @param {string} id ioBroker id
   * @param {any} value new value for the ioBroker id
   */
  public setState(id, value): void {
    this.servConn.setState(id, value, (err) => {});
  }
}
