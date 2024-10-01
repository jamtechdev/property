import { Body, Req, Controller, Post, HttpException, HttpStatus, UseGuards, Get, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { CreateReminderDto } from 'src/dto/reminder/reminder.dto';
import { ReminderService } from 'src/services/reminder/reminder.service';
import { AuthGuard } from '@nestjs/passport';
import Reminder from 'models/reminder.model';
import { PaginationDto } from 'src/dto/pagination.dto';
@Controller('reminder')
export class ReminderController {
    constructor(private readonly reminderService: ReminderService) { }
    @Post('add-reminder')
    @UseGuards(AuthGuard('jwt'))
    async create(@Body() createReminderDto: CreateReminderDto) {
        try {
            const reminder = await this.reminderService.createReminder(createReminderDto)
            return reminder;
        }
        catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('reminderById')
    @UseGuards(AuthGuard('jwt'))
    async getReminderById(
        @Query('userId', ParseIntPipe) userId: number,
        @Query() paginationDto:PaginationDto,
        @Req() req: Request
    ): Promise<any> {
        const reminder = await this.reminderService.findByUserId(userId,paginationDto)
        if (!reminder) {
            throw new NotFoundException(`reminder not found ${userId}`)
        }
        return reminder;
    }

    @Get('search')
    @UseGuards(AuthGuard('jwt'))
    async search(
      @Query('userId') userId: number,
      @Query('description') description: string,
      @Query() paginationDto:PaginationDto,
    ): Promise<any> {
      if (!userId || !description) {
        throw new Error('Both userId and description must be provided');
      }
      return this.reminderService.searchTasks(userId, description, paginationDto);
    }
}
