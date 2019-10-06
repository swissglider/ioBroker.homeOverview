import { TestBed } from '@angular/core/testing';

import { IobrokerService } from './iobroker.service';

describe('IobrokerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: IobrokerService = TestBed.get(IobrokerService);
    expect(service).toBeTruthy();
  });
});
