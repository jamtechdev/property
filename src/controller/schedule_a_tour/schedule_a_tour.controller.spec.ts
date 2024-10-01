import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleATourController } from './schedule_a_tour.controller';

describe('ScheduleATourController', () => {
  let controller: ScheduleATourController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleATourController],
    }).compile();

    controller = module.get<ScheduleATourController>(ScheduleATourController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
