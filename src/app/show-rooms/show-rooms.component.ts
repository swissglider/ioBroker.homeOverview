import {
  Component,
  OnInit
} from '@angular/core';
import {
  StateStoreService
} from '../state-store.service'
import {
  ClrDatagridSortOrder
} from '@clr/angular';

/**
 * Shows all the Rooms from IOBroker
 */

@Component({
  selector: 'app-show-rooms',
  templateUrl: './show-rooms.component.html',
  styleUrls: ['./show-rooms.component.css']
})
export class ShowRoomsComponent implements OnInit {

  /** the default sort for the web site */
  descSort = ClrDatagridSortOrder.DESC;

  /** Array with Room Enums to be showed */
  new_enums: {
    id: string,
    numberOfMembers: number,
    name: string,
    members: string,
    lastUpdate: number
  } [] = [];

  /** @ignore */
  constructor(private stateStoreService: StateStoreService) {}

  /** inits all the enums */
  ngOnInit() {
    this.stateStoreService.getEnums().subscribe((enums) => {
      if (enums) {
        enums.forEach((value$, key, array) => {
          if (key.startsWith('enum.rooms.')) {
            value$.subscribe((enum_) => {
              if (typeof enum_.common.name === 'object') {
                this.new_enums.push({
                  id: key,
                  name: enum_.common.name.de,
                  numberOfMembers: enum_.common.members.length,
                  members: enum_.common.members.join('\n'),
                  lastUpdate: enum_.ts
                });
              } else {
                this.new_enums.push({
                  id: key,
                  name: enum_.common.name,
                  numberOfMembers: enum_.common.members.length,
                  members: enum_.common.members.join('\n'),
                  lastUpdate: enum_.ts
                });
              }
            });

          }
        });
      }
    });
  }

}
