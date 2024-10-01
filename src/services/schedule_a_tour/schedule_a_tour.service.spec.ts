import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleATourService } from './schedule_a_tour.service';

describe('ScheduleATourService', () => {
  let service: ScheduleATourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleATourService],
    }).compile();

    service = module.get<ScheduleATourService>(ScheduleATourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
