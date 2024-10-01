import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  @IsNotEmpty()
  senderId: number;

  @IsInt()
  @IsNotEmpty()
  receiverId: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  messageType: string;
}
