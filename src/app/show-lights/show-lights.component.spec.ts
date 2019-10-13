import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLightsComponent } from './show-lights.component';

describe('ShowLightsComponent', () => {
  let component: ShowLightsComponent;
  let fixture: ComponentFixture<ShowLightsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowLightsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowLightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
