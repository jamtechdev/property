export class CreateScheduleDto {
  userId: number;
  time: Date;
  name: string;
  phone: string;
  email: string;
  message: string;
  tour_type: string;
  property_owner: number;
}

export class UpdateScheduleDto {
  userId: number;
  time: Date;
  name: string;
  phone: string;
  email: string;
  message: string;
  tour_type: string;
  property_owner: number;
}
