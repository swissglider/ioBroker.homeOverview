import { Component, OnInit } from '@angular/core';

/**
 * To test
 */
@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})

export class TestComponent implements OnInit {

  /** @ignore */
  values: number[] = [102, 115, 130, 137];

  /** @ignore */
  constructor() { }

  /** @ignore */
  ngOnInit() {
  }

}
