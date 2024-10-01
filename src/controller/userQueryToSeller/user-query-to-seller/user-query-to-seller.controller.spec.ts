import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryToSellerController } from './user-query-to-seller.controller';

describe('UserQueryToSellerController', () => {
  let controller: UserQueryToSellerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserQueryToSellerController],
    }).compile();

    controller = module.get<UserQueryToSellerController>(UserQueryToSellerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
