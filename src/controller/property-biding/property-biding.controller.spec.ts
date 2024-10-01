import { Test, TestingModule } from '@nestjs/testing';
import { PropertyBidingController } from './property-biding.controller';

describe('PropertyBidingController', () => {
  let controller: PropertyBidingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyBidingController],
    }).compile();

    controller = module.get<PropertyBidingController>(PropertyBidingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
