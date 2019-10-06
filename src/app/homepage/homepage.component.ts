import { Component, OnInit} from '@angular/core';

import { IobrokerService } from '../iobroker.service';
import { StateStoreService } from '../state-store.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  objectTree: string;
  isConnected: boolean;
  updatedStateID: string;
  updatedState: string;
  newError: string;
  counter: number;

  constructor(private iobrokerService: IobrokerService, private stateStoreService: StateStoreService) { }

  ngOnInit() {
    this.getObjectTree();
    this.getIsConnected();
    this.getUpdatedState();
    this.getNewError();
    this.getCounter();
  }

  getObjectTree(): void {
    this.iobrokerService.getObjectTree()
      .subscribe(objectTree => this.objectTree = objectTree);
  }

  getIsConnected(): void {
    this.iobrokerService.getIsConnected()
      .subscribe((isConnected) => {
        this.isConnected = isConnected;
      });
  }

  getUpdatedState(): void {
    this.iobrokerService.getUpdatedState()
      .subscribe(([id, stateIO]) => {
        this.updatedStateID = id;
        this.updatedState = JSON.stringify(stateIO);
      });
  }

  getNewError(): void {
    this.iobrokerService.getNewError()
      .subscribe((err) => {
        this.newError = err;
      });
  }

  getCounter(): void {
    this.stateStoreService.getStatePerID('javascript.0.CounterChannel.CounterDevice.Counter')
      .subscribe((stateIO) => {
        if (stateIO && 'val' in stateIO) {
          this.counter = stateIO.val;
        }
      });
  }

  onChangeCounter(counter: number): void {
    console.log(counter);
    this.iobrokerService.setState('javascript.0.CounterChannel.CounterDevice.Counter', counter);
  }

}
