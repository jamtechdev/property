import { IsString, IsInt, IsEnum, Min } from 'class-validator';

enum ModeratorStatus {
  Pending = 'pending',
  Approved = 'approved',
}

export class CreateModeratorDto {
  readonly state: string;

  readonly county: any;

  readonly fee_to_pay: number;

  @IsEnum(ModeratorStatus)
  readonly status: ModeratorStatus;

  readonly noOfSoldProp: number;

  readonly noOfHoldProp: number;

  readonly noOfDeclinedProp: number;

  readonly userId: number;

  readonly email: string;
}

enum ticketSystemStatus {
  Pending = 'pending',
  Approved = 'approved',
  Cancel = 'cancel',
}
export class CreateTicketSystemDto {
  moderatorId: number;
  description: string;
  images: string;
  property_url: string;
  admin_feedback: string;
  userId: number;
  is_paid: boolean;
  @IsEnum(ticketSystemStatus)
  readonly status: ticketSystemStatus;
}

export class CreateWaitingListModeratorDto {
  readonly state: string;

  readonly county: string;

  readonly fee_to_pay: number;

  readonly noOfSoldProp: number;

  readonly noOfHoldProp: number;

  readonly noOfDeclinedProp: number;

  readonly userId: number;

  readonly email: string;
}

export class CreateRatingDto {
  userId?: number;
  moderatorId?: number;
  rating?: number;
  description?: string;
}

export class CreateCountyPaymentDto {
  moderatorIdId?: number;
  countyId?: string;
  last_pay_date?: Date;
  next_pay_date?: Date;
  default_pay: boolean;
}
