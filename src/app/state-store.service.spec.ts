import { TestBed } from '@angular/core/testing';

import { StateStoreService } from './state-store.service';

describe('StateStoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StateStoreService = TestBed.get(StateStoreService);
    expect(service).toBeTruthy();
  });
});
