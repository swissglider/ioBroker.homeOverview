import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject} from 'rxjs';

import { IobrokerService } from './iobroker.service';
import { of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/** should no longer be used */
@Injectable({
  providedIn: 'root'
})
export class StateStoreService {

  /** @ignore */
  private storeStateMap = new Map(); // --> key (id) / value (State) <-- state is an observer
  /** @ignore */
  private storeObjectMap = new Map(); // --> key (id) / value (Object) <-- object is an observer
  /** @ignore */
  private storeEnumMap = new Map(); // --> key (id) / value (Enum) <-- enum is an observer
  /** @ignore */
  private configObs$ = new BehaviorSubject< any >(null); // --> config is a observer
  /** @ignore */
  private enumMap$ = new BehaviorSubject< Map < string, Subject< any > > >(null);

  /** @ignore */
  constructor(private iobrokerService: IobrokerService) {
    // load all states into state map
    this.loadAllStatesIntoObserverMap();
    console.log('Nach loadAllStatesIntoObserverMap');

    // load all objects into object maps
    this.loadAllObjectsIntoObserverMap();

    // load all enums into object maps
    this.loadAllEnumsIntoObserverMap();

    // load config
    this.loadAllConfigIntoObserverMap();
  }

  /** @ignore */
  private async loadAllStatesIntoObserverMap() {
    // load all states from ioBroker
    const data: any = await this.iobrokerService.getStates(null);
    for (const id in data) {
      if (data.hasOwnProperty(id)) {
        const stateIO = data[id];
        if (!this.storeStateMap.has(id)) {
          const tempStateOb$ = new BehaviorSubject< any >(stateIO);
          this.storeStateMap.set(id, tempStateOb$);
        }
        this.storeStateMap.get(id).next(stateIO);
      }
    }
    // update all state changes
    this.iobrokerService.getUpdatedState()
      .subscribe(([id, stateIO]) => {
        if (!this.storeStateMap.has(id)) {
          const tempStateOb$ = new BehaviorSubject< any >(stateIO);
          this.storeStateMap.set(id, tempStateOb$);
        }
        this.storeStateMap.get(id).next(stateIO);
      });
  }

  /** @ignore */
  private async loadAllObjectsIntoObserverMap() {
    // load all objects from ioBroker
    const data: any = await this.iobrokerService.getObjects();
    for (const id in data) {
      if (data.hasOwnProperty(id)) {
        const objectIO = data[id];
        if (!this.storeObjectMap.has(id)) {
          const tempObjectsOb$ = new BehaviorSubject< any >(objectIO);
          this.storeObjectMap.set(id, tempObjectsOb$);
        }
        this.storeObjectMap.get(id).next(objectIO);
      }
    }

    // update all object changes
    this.iobrokerService.getUpdatedObject()
      .subscribe(([id, objectIO]) => {
        if (!this.storeObjectMap.has(id)) {
          const tempObjectsOb$ = new BehaviorSubject< any >(objectIO);
          this.storeObjectMap.set(id, tempObjectsOb$);
        }
        this.storeObjectMap.get(id).next(objectIO);
      });
  }

  /** @ignore */
  private async loadAllEnumsIntoObserverMap() {
    // load all enums from ioBroker
    const data: any = await this.iobrokerService.getEnums();
    for (const id in data) {
      if (data.hasOwnProperty(id)) {
        const enumIO = data[id];
        if (!this.storeEnumMap.has(id)) {
          const tempEnumsOb$ = new BehaviorSubject< any >(enumIO);
          this.storeEnumMap.set(id, tempEnumsOb$);
        }
        this.storeEnumMap.get(id).next(enumIO);
      }
    }
    this.enumMap$.next(this.storeEnumMap);
  }

  /** @ignore */
  private async loadAllConfigIntoObserverMap() {
    // load all config from ioBroker
    const data: any = await this.iobrokerService.getConfig();
    this.configObs$.next(data);
  }

  /** @ignore */
  public getStatePerID(id: string):  Subject< any > {
    if (!this.storeStateMap.has(id)) {
      const tempStateOb$ = new BehaviorSubject< any >(null);
      this.storeStateMap.set(id, tempStateOb$);
    }
    return this.storeStateMap.get(id);
  }

  /** @ignore */
  public getConfig(): Subject< any > {
    return this.configObs$;
  }

  /** @ignore */
  public getEnums(): Subject< Map < string, Subject< any > > >  {
    return this.enumMap$;
  }
}
