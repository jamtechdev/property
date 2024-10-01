import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  invoiceUrl: string;

  @IsOptional()
  @IsString()
  transactionId: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  paidFor: string;
}
