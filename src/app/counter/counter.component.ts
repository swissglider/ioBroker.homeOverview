import { Component, OnInit } from '@angular/core';

import { IobrokerService } from '../iobroker.service';
import { StateStoreService } from '../state-store.service';
import { SelectorServiceService, TselectionFN, TstateObjectContainerMap, IstateObjectContainer } from '../selector-service.service';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.css']
})
export class CounterComponent implements OnInit {

  counter: number;
  new_counter: number;

  counterSelectorFN:TselectionFN = ((stateObjectContainer:IstateObjectContainer) => {
    if(stateObjectContainer && 'id' in stateObjectContainer){
      return stateObjectContainer.id === 'javascript.0.CounterChannel.CounterDevice.Counter';
    }
    return false;
  });

  constructor(
    private iobrokerService: IobrokerService,
    private stateStoreService: StateStoreService,
    private selectorService: SelectorServiceService
  ) {}

  ngOnInit() {
    this.getCounter();
    this.getNewCounter();
  }

  getCounter(): void {
    this.stateStoreService.getStatePerID('javascript.0.CounterChannel.CounterDevice.Counter')
      .subscribe((stateIO) => {
        if (stateIO && 'val' in stateIO) {
          this.counter = stateIO.val;
        }
      });
  }

  getNewCounter(): void {
    let selection = this.selectorService.getSelector('counterSelector', this.counterSelectorFN);
    selection.mapChangeObserver$.subscribe((stateObjectContainer) => {
      if(stateObjectContainer === null) {return}
      stateObjectContainer.stateObjctContainer$.subscribe(([ioState, ioObject]) => {
        console.log(ioState);
        console.log(ioObject);
      })
    });
    selection.stateObjectContainerMap.forEach((stateObjectContainer, id, wholeMap) => {
      stateObjectContainer.stateObjctContainer$.subscribe(([ioState, ioObject]) => {
        console.log(ioState);
        console.log(ioObject);
      })
    })
    //debugger;
  }

  onChangeCounter(counter: number): void {
    console.log(counter);
    this.iobrokerService.setState('javascript.0.CounterChannel.CounterDevice.Counter', counter);
  }

}
