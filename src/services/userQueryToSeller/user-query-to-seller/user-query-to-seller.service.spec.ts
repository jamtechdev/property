import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryToSellerService } from './user-query-to-seller.service';

describe('UserQueryToSellerService', () => {
  let service: UserQueryToSellerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserQueryToSellerService],
    }).compile();

    service = module.get<UserQueryToSellerService>(UserQueryToSellerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
