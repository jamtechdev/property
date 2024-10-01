import { IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  userId: number;
  propertyId: number;
  email: string;
  title: string;

  review: string;

  rating: number;
  helpfull: string;
  not_helpfull: string;
}
