import {
  IsString,
  IsEmail,
  IsNumber,
  IsNotEmpty,
  IsDate,
  IsEmpty,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  username: string;

  mobile: string;

  email: string;

  firstname: string;

  lastname: string;

  Position: string;

  Language: string;

  company_name: string;

  tax_no: string;

  address: string;

  about_me: string;

  social_media: string;

  latitude: number;

  longitude: number;

  roleId: number;

  city: string;

  state: string;

  country: string;

  password: string;
  slug: string;

  @IsOptional()
  image: string;
}

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}


export class ViewPropertyUserDto {
  userId: number;
  postedBy: number;
  propertyListId:number
}
export class CreateBusinessCardDto {
  name: string;
  mobile: string;
  email: string;
  description: string;
  userId: number;
  image: string;
}
