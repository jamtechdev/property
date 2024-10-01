import { Test, TestingModule } from '@nestjs/testing';
import { StoreContentService } from './store-content.service';

describe('StoreContentService', () => {
  let service: StoreContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoreContentService],
    }).compile();

    service = module.get<StoreContentService>(StoreContentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
