import { Component, OnInit } from '@angular/core';

import { IobrokerService } from '../iobroker.service';
import { StateStoreService } from '../state-store.service';

/**
 * Shows some ioBroker Details
 */

@Component({
  selector: 'app-main-site',
  templateUrl: './main-site.component.html',
  styleUrls: ['./main-site.component.css']
})
export class MainSiteComponent implements OnInit {

  /** @ignore */
  hostName: string;
  /** @ignore */
  isConnected: boolean;
  /** @ignore */
  updatedStateID: string;
  /** @ignore */
  updatedState: string;
  /** @ignore */
  newError: string;

  /** @ignore */
  constructor(private iobrokerService: IobrokerService, private stateStoreService: StateStoreService) { }


  /** @ignore */
  ngOnInit() {
    this.getInitInformations();
    this.getUpdatedState();
    this.getNewError();
  }

  /** @ignore */
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

  /** @ignore */
  getUpdatedState(): void {
    this.iobrokerService.getUpdatedState()
      .subscribe(([id, stateIO]) => {
        this.updatedStateID = id;
        this.updatedState = JSON.stringify(stateIO);
      });
  }

  /** @ignore */
  getNewError(): void {
    this.iobrokerService.getNewError()
      .subscribe((err) => {
        this.newError = err;
      });
  }

}
