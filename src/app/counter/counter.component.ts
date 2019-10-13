import { Component, OnInit } from '@angular/core';

import { IobrokerService } from '../iobroker.service';
import { SelectorServiceService, TselectionFN, TstateObjectContainerMap, IstateObjectContainer } from '../selector-service.service';

/**
 * Counter Example that uses the following ioBroker id to simulate:
 * 'javascript.0.CounterChannel.CounterDevice.Counte'
 */
@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.css']
})
export class CounterComponent implements OnInit {

  /** counter number */
  counter: number;
  /** new counter only used for new Input */
  newCounter: number;

  /** selection function to select only the counter id */
  counterSelectorFN:TselectionFN = ((stateObjectContainer:IstateObjectContainer) => {
    if(stateObjectContainer && 'id' in stateObjectContainer){
      return stateObjectContainer.id === 'javascript.0.CounterChannel.CounterDevice.Counter';
    }
    return false;
  });

  /** @ignore */
  constructor(
    private iobrokerService: IobrokerService,
    private selectorService: SelectorServiceService
  ) {}

  /** @ignore */
  ngOnInit() {
    this.getNewCounter();
  }

  /** init and update the counter from ioBroker */
  getNewCounter(): void {
    let selection = this.selectorService.getSelector('counterSelector', this.counterSelectorFN);
    selection.mapChangeObserver$.subscribe((stateObjectContainer) => {
      if(stateObjectContainer === null) {return}
      stateObjectContainer.stateObjectContainer$.subscribe(([ioState, ioObject]) => {
        if(ioState && 'val' in ioState && ioState['val'] !== null && typeof ioState['val'] === 'number') {
          this.counter = ioState['val'];
          this.newCounter = ioState['val'];
        }
      })
    });
    selection.stateObjectContainerMap.forEach((stateObjectContainer, id, wholeMap) => {
      stateObjectContainer.stateObjectContainer$.subscribe(([ioState, ioObject]) => {
        if(ioState && 'val' in ioState && ioState['val'] !== null  && typeof ioState['val'] === 'number') {
          this.counter = ioState['val'];
          this.newCounter = ioState['val'];
        }
      })
    })
  }

  /**
   * changes the ioBroker state with the new_counter
   */
  onChangeCounter(): void {
    if(typeof this.newCounter !== 'number'){
      this.newCounter = Number.parseInt(this.newCounter);
      if(isNaN(this.newCounter)){
        return;
      }
    }
    this.counter = this.newCounter;
    this.iobrokerService.setState('javascript.0.CounterChannel.CounterDevice.Counter', this.newCounter);
  }

  /** decrement the counter with -1 on ioBroker */
  counterDecrement(): void {
    this.counter = this.counter-1;
    this.newCounter = this.counter
    this.iobrokerService.setState('javascript.0.CounterChannel.CounterDevice.Counter', this.counter);
  }

  /** reset the counter to 0 on ioBroker */
  counterReset(): void {
    this.counter = 0;
    this.newCounter = this.counter
    this.iobrokerService.setState('javascript.0.CounterChannel.CounterDevice.Counter', this.counter);
  }

  /** increment the counter with +1 on ioBroker */
  counterIncrement(): void {
    this.counter = this.counter+1;
    this.newCounter = this.counter
    this.iobrokerService.setState('javascript.0.CounterChannel.CounterDevice.Counter', this.counter);
  }

}
