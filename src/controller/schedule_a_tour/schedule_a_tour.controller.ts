import {
  Body,
  Req,
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Post,
  NotFoundException,
  Delete,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import ScheduleATour from 'models/scheduleatour.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
} from 'src/dto/schedule_a_Tour/schedule_a_Tour.dto';
import { ScheduleATourService } from 'src/services/schedule_a_tour/schedule_a_tour.service';

@Controller('schedule-a-tour')
export class ScheduleATourController {
  constructor(private readonly scheduleATourService: ScheduleATourService) {}
  @Post('add-schedule')
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    try {
      const schedule =
        await this.scheduleATourService.create(createScheduleDto);
      return schedule;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('scheduleById')
  async getScheduleById(
    @Query('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<ScheduleATour> {
    const schedule = await this.scheduleATourService.findById(id);
    if (!schedule) {
      throw new NotFoundException('schedule not found');
    }
    return schedule;
  }

  @Get('get-schedule-by-userid')
  @UseGuards(AuthGuard('jwt'))
  async getScheduleByUserId(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page: number = 1, // Default page is 1
    @Query('limit', ParseIntPipe) limit: number = 10, // Default limit is 10
    @Req() req: Request,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ScheduleATour[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { schedules, totalItems } =
      await this.scheduleATourService.findByUserId(userId, page, limit);

    if (!schedules || schedules.length === 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Schedule not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const totalPages = Math.ceil(totalItems / limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Schedule found successfully',
      data: schedules,
      totalItems,
      totalPages,
      currentPage: page,
    };
  }

  @Get('all_schedule')
  async findSchedule(
    @Query('propertyOwnerId') propertyOwnerId: number,
    @Query() paginationDto: PaginationDto,
    @Query('search') search: string,
  ): Promise<any> {
    const all_schedule = await this.scheduleATourService.findAllSchedule(
      propertyOwnerId,
      paginationDto,
      search,
    );
    if (!all_schedule) {
      throw new NotFoundException(`tour schedule not found`);
    }
    return all_schedule;
  }
  @Put('update-schedule/:id')
  async update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    try {
      const updateSchedule = await this.scheduleATourService.update(id, {
        ...updateScheduleDto,
      });
      return updateSchedule;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('delete-schedule/:id')
  async deleteScheduleById(@Param('id', ParseIntPipe) id: number) {
    const deleteSchedule =
      await this.scheduleATourService.deleteScheduleById(id);
    return deleteSchedule;
  }

  @Get('tour/search')
  async searchTour(@Query('search') search: string) {
    const result = await this.scheduleATourService.searchTour({ search });
    return result;
  }
  @Put('add-reply-tour-schedule/:id/:ownerId')
  @UseGuards(AuthGuard('jwt'))
  async updateScheduleByIdAndOwner(
    @Param('id', ParseIntPipe) id: number,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Body() updateData: { is_replied: boolean; reply_replied: string },
  ) {
    return await this.scheduleATourService.updateScheduleByIdAndOwner(
      id,
      ownerId,
      updateData,
    );
  }
}
