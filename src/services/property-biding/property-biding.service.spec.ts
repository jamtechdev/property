import { Test, TestingModule } from '@nestjs/testing';
import { PropertyBidingService } from './property-biding.service';

describe('PropertyBiddingService', () => {
  let service: PropertyBidingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyBidingService],
    }).compile();

    service = module.get<PropertyBidingService>(PropertyBidingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
