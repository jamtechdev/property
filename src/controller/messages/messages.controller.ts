import { Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import Message from 'models/messages.model';
import { CreateMessageDto } from 'src/dto/messages/messages.dto';
import { MessagesService } from 'src/services/messages/messages.service';

@Controller('messages')
export class MessagesController {

    constructor(private readonly messagesService: MessagesService) {}

    @Post('send')
    async create(@Body() createMessageDto: CreateMessageDto) {
      return this.messagesService.create(createMessageDto);
    }

    @Get('getAllChats')
    async findUserAllChats(@Query('userId', ParseIntPipe) userId: number) {
        const data = await this.messagesService.findUserAllChats(userId);
        return {
          statusCode: 200,
          message: 'Chats found successfully',
          data: data,
        };
      }

      @Get('getUserChat')
      async findMessagesBetweenUsers(
        @Query('senderId', ParseIntPipe) senderId: number,
        @Query('receiverId', ParseIntPipe) receiverId: number
      ) {
        const data = await this.messagesService.findMessagesBetweenUsers(senderId, receiverId);
        return {
          statusCode: 200,
          message: 'Messages found successfully',
          data: data,
        };
      }
}
