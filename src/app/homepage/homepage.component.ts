import { Component, OnInit} from '@angular/core';

import { IobrokerService } from '../iobroker.service';
import { StateStoreService } from '../state-store.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: [
    './homepage.component.css'
  ]
})
export class HomepageComponent implements OnInit {

  hostName: string;
  isConnected: boolean;
  updatedStateID: string;
  updatedState: string;
  newError: string;
  counter: number;

  constructor(private iobrokerService: IobrokerService, private stateStoreService: StateStoreService) { }

  ngOnInit() {
    this.getInitInformations();
    this.getUpdatedState();
    this.getNewError();
    this.getCounter();
  }

  getInitInformations(): void {
    this.iobrokerService.getLiveHost()
      .subscribe(hostName => this.hostName = hostName);
    this.iobrokerService.getIsConnected()
      .subscribe((isConnected) => {
        this.isConnected = isConnected;
      });
    this.stateStoreService.getConfig()
    .subscribe((config) => {    }); 
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
