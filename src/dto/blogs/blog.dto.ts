import { IsNotEmpty } from 'class-validator';

export class CreateBlogDto {
  userId: number;

  title: string;

  description: string;

  images: string;
  
  slug: string;
}
export class UpdateBlogDto {
  @IsNotEmpty()
  userId: number;

  title: string;

  description: string;

  images: string;
}
