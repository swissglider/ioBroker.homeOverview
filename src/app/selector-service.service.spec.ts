import { TestBed } from '@angular/core/testing';

import { SelectorServiceService } from './selector-service.service';

describe('SelectorServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SelectorServiceService = TestBed.get(SelectorServiceService);
    expect(service).toBeTruthy();
  });
});
