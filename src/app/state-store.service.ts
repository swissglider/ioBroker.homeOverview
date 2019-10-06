import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject} from 'rxjs';

import { IobrokerService } from './iobroker.service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateStoreService {

  private storeStateMap = new Map(); // --> key (id) / value (State) <-- state is an observer
  private storeObjectMap = new Map(); // --> key (id) / value (Object) <-- object is an observer
  private storeEnumMap = new Map(); // --> key (id) / value (Enum) <-- enum is an observer
  private configObs = new BehaviorSubject<any>(null); // --> config is a observer

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

  private async loadAllStatesIntoObserverMap() {
    // load all states from ioBroker
    const data: any = await this.iobrokerService.getStates(null);
    for (const id in data) {
      if (data.hasOwnProperty(id)) {
        const stateIO = data[id];
        if (!this.storeStateMap.has(id)) {
          const tempStateOb = new BehaviorSubject<any>(stateIO);
          this.storeStateMap.set(id, tempStateOb);
        }
        this.storeStateMap.get(id).next(stateIO);
      }
    }
    // update all state changes
    this.iobrokerService.getUpdatedState()
      .subscribe(([id, stateIO]) => {
        if (!this.storeStateMap.has(id)) {
          const tempStateOb = new BehaviorSubject<any>(stateIO);
          this.storeStateMap.set(id, tempStateOb);
        }
        this.storeStateMap.get(id).next(stateIO);
      });
  }

  private async loadAllObjectsIntoObserverMap() {
    // load all objects from ioBroker
    const data: any = await this.iobrokerService.getObjects();
    for (const id in data) {
      if (data.hasOwnProperty(id)) {
        const objectIO = data[id];
        if (!this.storeObjectMap.has(id)) {
          const tempObjectsOb = new BehaviorSubject<any>(objectIO);
          this.storeObjectMap.set(id, tempObjectsOb);
        }
        this.storeObjectMap.get(id).next(objectIO);
      }
    }

    // update all object changes
    this.iobrokerService.getUpdatedObject()
      .subscribe(([id, objectIO]) => {
        if (!this.storeObjectMap.has(id)) {
          const tempObjectsOb = new BehaviorSubject<any>(objectIO);
          this.storeObjectMap.set(id, tempObjectsOb);
        }
        this.storeObjectMap.get(id).next(objectIO);
      });
  }



  private async loadAllEnumsIntoObserverMap() {
    // load all enums from ioBroker
    const data: any = await this.iobrokerService.getEnums();
    for (const id in data) {
      if (data.hasOwnProperty(id)) {
        const enumIO = data[id];
        if (!this.storeEnumMap.has(id)) {
          const tempEnumsOb = new BehaviorSubject<any>(enumIO);
          this.storeEnumMap.set(id, tempEnumsOb);
        }
        this.storeEnumMap.get(id).next(enumIO);
      }
    }

    // update all enum changes
    // this.iobrokerService.getUpdatedEnum()
    //   .subscribe(([id, enumIO]) => {
    //     if (!this.storeEnumMap.has(id)) {
    //       const tempEnumsOb = new BehaviorSubject<any>(enumIO);
    //       this.storeEnumMap.set(id, tempEnumsOb);
    //     }
    //     this.storeEnumMap.get(id).next(enumIO);
    //   });
  }

  private async loadAllConfigIntoObserverMap() {
    // load all config from ioBroker
    const data: any = await this.iobrokerService.getConfig();
    this.configObs.next(data);
  }

  public getStatePerID(id: string) {
    if (!this.storeStateMap.has(id)) {
      const tempStateOb = new BehaviorSubject<any>(null);
      this.storeStateMap.set(id, tempStateOb);
    }
    return this.storeStateMap.get(id);
  }

  public getConfig() {
    return this.configObs;
  }
}
