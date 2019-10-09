import {
  Injectable
} from '@angular/core';
import {
  Subject,
  BehaviorSubject
} from 'rxjs';
import {
  of
} from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';

import {
  IobrokerService
} from './iobroker.service';

export interface IstateObjectContainer {
  id: string;
  ioState: Object;
  ioObject: Object;
  stateObjctContainer$ : Subject< [Object, Object] >; // Subject < [state, Object] >
}

export type TstateObjectContainerMap = Map < string, IstateObjectContainer > ;
export type TselectionFN = (IstateObjectContainer) => boolean;

export interface Iselection {
  name: string;
  mapChangeObserver$: Subject <IstateObjectContainer>;
  stateObjectContainerMap: TstateObjectContainerMap;
  selectionFN: TselectionFN;
}

@Injectable({
  providedIn: 'root'
})
export class SelectorServiceService {

  private stateObjectContainerMap: TstateObjectContainerMap = new Map();
  private selectionMap: Map < string, Iselection > = new Map(); // Mapp(<id:string,Iselection)

  private storeStateMap: Map < string, Object > = new Map(); // --> key (id) / value (State)
  private storeObjectMap: Map < string, Object > = new Map(); // --> key (id) / value (Object)

  constructor(private iobrokerService: IobrokerService) {
    this.addAllStateObjects();
    this.checkStateUpdate();
  }

  /**
   * subscribes for updates on States and Objects and updates all the Container states.
   * Also updates selections if needed
   */
  private checkStateUpdate() {

    // update when States changes
    this.iobrokerService.getUpdatedState()
      .subscribe(([id, stateIO]) => {
        this.storeStateMap.set(id, stateIO);
        this.addStateObjectToContainer(id, stateIO);
        this.setUpdateStateObjectContainer$(id);
      });

    // update when Object changes
    this.iobrokerService.getUpdatedObject()
      .subscribe(([id, objctIO]) => {
        this.storeStateMap.set(id, objctIO);
        if (!this.storeStateMap.has(id)) {
          return;
        }
        this.addStateObjectToContainer(id, this.storeStateMap.get(id));
        this.setUpdateStateObjectContainer$(id);
      })
  }

  /**
   * Loads all States and Objects from ioBroker into the cache
   */
  private async addAllStateObjects() {
    // load all states and Objects into the stateObjectContainer
    const states: any = await this.iobrokerService.getStates(null);
    for (const id in states) {
      this.storeStateMap.set(id, states[id]);
    }
    const objects: any = await this.iobrokerService.getObjects().catch((err) => {
      console.error(err);
    });
    for (const id in objects) {
      this.storeObjectMap.set(id, objects[id]);
    }

    this.storeStateMap.forEach((stateIO: Object, id: string, map) => {
      if(stateIO && id){
        let ioState = stateIO;
        this.addStateObjectToContainer(id, ioState);
        this.setUpdateStateObjectContainer$(id);
      }
    })

  }

  /**
   * create or updates the StateObjectContainer and updates also the StateObjectContainer Observer
   * 
   * @param id id of the ioBroker state/object
   * @param stateIO ioBroker state to be set into the stateObjectContainer
   */
  private addStateObjectToContainer(id: string, stateIO: Object) {
    if (this.stateObjectContainerMap.has(id)) {
      let stateContainer: IstateObjectContainer = this.stateObjectContainerMap.get(id);
      stateContainer.ioState = stateIO;
      stateContainer.ioObject = this.storeObjectMap.has(id) ? this.storeObjectMap.get(id) : null;
      stateContainer.stateObjctContainer$.next([stateContainer.ioState, stateContainer.ioObject]);
    } else {
      let stateContainer: IstateObjectContainer = {
        id: id,
        ioState: stateIO,
        ioObject: this.storeObjectMap.has(id) ? this.storeObjectMap.get(id) : null,
        stateObjctContainer$: null,
      };
      stateContainer.stateObjctContainer$ = new BehaviorSubject([stateContainer.ioState, stateContainer.ioObject]);
      this.stateObjectContainerMap.set(id, stateContainer);
    }
  }

  /**
   * Updates the StateObjectContainer in all Selections already registered
   * 
   * @param id id of the ioBroker state/object
   */
  private setUpdateStateObjectContainer$(id: string) {

    this.selectionMap.forEach((selection: Iselection, selectionName: string, map) => {
      this.createUpdateSelectionMap(id, selection);
    });
  }

  /**
   * 
   * @param id id of the ioBroker state/object
   * @param selection creates or updates the selection map if selection fits the updated state
   */
  private createUpdateSelectionMap(id: string, selection: Iselection) {
    // check all Iselection in the observersPerSelectionMap and update then next
    let stateObjectContainer = this.stateObjectContainerMap.get(id);

    // if not fit the selection createria, return
    if (!selection.selectionFN(stateObjectContainer)) {
      return;
    }

    // if is already in the stateObjectContainerMap, just return
    if(selection.stateObjectContainerMap.has(id)){
      return;
    }

    // if not in stateObjectContainerMap, add it and update mapChangeObserver$
    selection.stateObjectContainerMap.set(id, this.stateObjectContainerMap.get(id));
    selection.mapChangeObserver$.next(this.stateObjectContainerMap.get(id));
  }

  public getSelector(name: string, selectionFN: TselectionFN): Iselection {
    // id selection is alread created, return directly the observerMap$
    if(this.selectionMap.has(name)) {
      return this.selectionMap.get(name);
    }

    let observerMap: TstateObjectContainerMap = new Map();

    
    //run selectionFN and add all IstateObjectContainer$ from TstateObjectContainerMap that fits to the Iselection
    this.stateObjectContainerMap.forEach((stateObjectContainer, key, wholeMap) => {
      if(selectionFN(stateObjectContainer)){
        observerMap.set(key, stateObjectContainer);
      }
    })
    // create and save the Iselection into the this.observersPerSelectionMap


    let selection:Iselection = {
      name: name,
      mapChangeObserver$: new BehaviorSubject(null),
      stateObjectContainerMap: observerMap,
      selectionFN: selectionFN
    }

    this.selectionMap.set(name, selection);

    // returns the observerMap$
    return selection;
  }

}