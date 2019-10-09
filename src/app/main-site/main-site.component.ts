import { Component, OnInit } from '@angular/core';

import { IobrokerService } from '../iobroker.service';
import { StateStoreService } from '../state-store.service';

@Component({
  selector: 'app-main-site',
  templateUrl: './main-site.component.html',
  styleUrls: ['./main-site.component.css']
})
export class MainSiteComponent implements OnInit {

  hostName: string;
  isConnected: boolean;
  updatedStateID: string;
  updatedState: string;
  newError: string;

  constructor(private iobrokerService: IobrokerService, private stateStoreService: StateStoreService) { }


  ngOnInit() {
    this.getInitInformations();
    this.getUpdatedState();
    this.getNewError();
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

}
