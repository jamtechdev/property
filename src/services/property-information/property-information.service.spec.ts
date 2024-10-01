import { Test, TestingModule } from '@nestjs/testing';
import { PropertyInformationService } from './property-information.service';

describe('PropertyInformationService', () => {
  let service: PropertyInformationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyInformationService],
    }).compile();

    service = module.get<PropertyInformationService>(PropertyInformationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
