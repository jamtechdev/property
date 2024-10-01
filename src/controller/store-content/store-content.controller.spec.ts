import { Test, TestingModule } from '@nestjs/testing';
import { StoreContentController } from './store-content.controller';

describe('StoreContentController', () => {
  let controller: StoreContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreContentController],
    }).compile();

    controller = module.get<StoreContentController>(StoreContentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
