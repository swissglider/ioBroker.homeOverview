import {
  Component,
  OnInit,
} from '@angular/core';
import {
  IobrokerService
} from '../iobroker.service';
import {
  ClrDatagridSortOrder
} from '@clr/angular';
import {
  SelectorServiceService,
  TselectionFN,
  IstateObjectContainer
} from '../selector-service.service';
import { isObject } from 'util';

/**
 * Component to display all the lights that are within a Room
 */

@Component({
  selector: 'app-show-lights',
  templateUrl: './show-lights.component.html',
  styleUrls: ['./show-lights.component.css']
})

export class ShowLightsComponent implements OnInit {

  /** the default sort for the web site */
  ascSort = ClrDatagridSortOrder.ASC;

  /**
   * the lightsArray that has all the lights observer in it
   */
  lightsArray:[{id:string, ioState:{}, ioObject:{}, roomsIDArray:string}];

  /**
   * the lightSelector function for the selector-service to select the needed stateObjectContainers.
   * in this case select only the stateObjectContainerswith switch.lights and enum has a room
   */
  lightSelectorFN: TselectionFN = ((stateObjectContainer: IstateObjectContainer) => {
    return (
      stateObjectContainer && 
      'ioObject' in stateObjectContainer && 
      stateObjectContainer.ioObject &&
      'common' in stateObjectContainer.ioObject && 
      'role' in stateObjectContainer.ioObject['common'] &&
      stateObjectContainer.ioObject['common']['role'] === 'switch.light' &&
      'enums' in stateObjectContainer.ioObject && 
      Object.keys(stateObjectContainer.ioObject['enums']).length > 0
    );
  });

  /**
   * @ignore
   */
  constructor(
    private iobrokerService: IobrokerService,
    private selectorService: SelectorServiceService
  ) {}

  /**
   * @ignore
   */
  ngOnInit() {
    this.initAllLights();
  }

  /**
   * reads all the lights and sets the value to the updatLightArray
   */
  initAllLights() {
    let selection = this.selectorService.getSelector('allLightsSelector', this.lightSelectorFN);
    selection.mapChangeObserver$.subscribe((stateObjectContainer) => {
      if(stateObjectContainer === null) {return}
      stateObjectContainer.stateObjectContainer$.subscribe(([ioState, ioObject]) => {
        if(ioState && 'val' in ioState && ioState['val'] !== null && typeof ioState['val'] === 'number') {

        }
        // console.log(ioState);
        // console.log(ioObject);
        this.updateLightArray(ioObject['_id'], ioState, ioObject);
      })
    });
    selection.stateObjectContainerMap.forEach((stateObjectContainer, id, wholeMap) => {
      stateObjectContainer.stateObjectContainer$.subscribe(([ioState, ioObject]) => {
        if(ioState && 'val' in ioState && ioState['val'] !== null  && typeof ioState['val'] === 'number') {
        }
        // console.log(ioState);
        // console.log(ioObject);
        this.updateLightArray(id, ioState, ioObject);
      })
    })
  }

  /**
   * Updates the LightArray with the given with the new ioState and ioObject.
   * If the LightArray do not yet have a enty with that id, it adds a new one
   * 
   * @example
   * Simple call it from within the component:
   * this.updateLightArray(new_id, new_ioState, new_ioObject);
   * 
   * @param {sting} id ioBroker ID
   * @param {Object} ioState ioBroker state Object
   * @param {Object} ioObject ioBroker Object Object
   * @returns void
   */
  private updateLightArray(id:string, ioState:Object, ioObject:Object){
    const enum_ = Object.values(ioObject['enums'])[0].toString();
    if(!this.lightsArray){
      this.lightsArray = [{id:id, ioState:ioState, ioObject:ioObject, roomsIDArray:enum_}];
      return;
    }
    const index = this.lightsArray.findIndex(e => e.id === id);
    if(index === -1){
      this.lightsArray.push({id:id, ioState:ioState, ioObject:ioObject, roomsIDArray:enum_});
    }
    else{
      this.lightsArray[index] = {id:id, ioState:ioState, ioObject:ioObject, roomsIDArray:enum_};
    }
  }

  /**
   * To change the Switch state for example in the Template
   * @param {string} id the ioBroker id to change
   * @param {boolean} value the new value the ioBroker id should have
   */
  onChangeSwitch(id:string, value:boolean){
    this.iobrokerService.setState(id, value);
  }
}
