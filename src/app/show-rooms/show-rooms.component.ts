import { Component, OnInit, ViewChild } from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { StateStoreService } from '../state-store.service'

export interface RommsElement {
  id: string;
  name: string;
  numberOfMembers: number;
}

@Component({
  selector: 'app-show-rooms',
  templateUrl: './show-rooms.component.html',
  styleUrls: ['./show-rooms.component.css']
})
export class ShowRoomsComponent implements OnInit {

  displayedColumns1: string[] = ['id', 'name', 'numberOfMembers'];
  dataSource1;

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private stateStoreService: StateStoreService) { }

  ngOnInit() {
    this.stateStoreService.getEnums().subscribe((enums)=>{
      let room_data: RommsElement[] = [];
      if(enums){
        enums.forEach((value$, key, array) => {
          if(key.startsWith('enum.rooms.')){
            value$.subscribe((enum_)=>{
              if( typeof enum_.common.name === 'object'){
                room_data.push({id:key, name:enum_.common.name.de, numberOfMembers:enum_.common.members.length});
              } else {
                room_data.push({id:key, name:enum_.common.name, numberOfMembers:enum_.common.members.length});
              }
            })
          }
        })
      }
      this.dataSource1 = new MatTableDataSource(room_data);
      this.dataSource1.sort = this.sort;
    })
  }

}
