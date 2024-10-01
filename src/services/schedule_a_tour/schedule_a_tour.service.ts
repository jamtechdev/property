import {
  Injectable,
  NotFoundException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import ScheduleATour from 'models/scheduleatour.model';
import User from 'models/user.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
} from 'src/dto/schedule_a_Tour/schedule_a_Tour.dto';
import { Op, fn, col, where } from 'sequelize';
@Injectable()
export class ScheduleATourService {
  constructor(
    @InjectModel(ScheduleATour)
    private readonly ScheduleATourModel: typeof ScheduleATour,
  ) {}
  async create(createScheduleDto: CreateScheduleDto): Promise<ScheduleATour> {
    const schedule = await this.ScheduleATourModel.create(createScheduleDto);
    return schedule;
  }

  async findById(id: number): Promise<ScheduleATour> {
    const schedule = await this.ScheduleATourModel.findOne({
      where: { id: id },
    });
    if (!schedule) {
      throw new NotFoundException('schedule not found');
    }
    return schedule;
  }

  async findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ schedules: ScheduleATour[]; totalItems: number }> {
    const offset = (page - 1) * limit;
    const { count: totalItems, rows: schedules } =
      await this.ScheduleATourModel.findAndCountAll({
        where: { userId: userId },
        limit: limit,
        offset: offset,
      });
    if (!schedules || schedules.length === 0) {
      throw new NotFoundException('Schedule not found');
    }

    return { schedules, totalItems };
  }

  async findAllSchedule(
    propertyOwnerId: number,
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const searchCondition = search
      ? {
          [Op.and]: [
            { property_owner: propertyOwnerId },
            {
              [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
              ],
            },
          ],
        }
      : { property_owner: propertyOwnerId };
    const totalSchedules = await this.ScheduleATourModel.count({
      where: searchCondition,
      include: [
        {
          model: User,
        },
      ],
    });
    const totalPages = Math.ceil(totalSchedules / parsedLimit);
    const schedules = await this.ScheduleATourModel.findAll({
      where: searchCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
      ],
      offset,
      limit: parsedLimit,
    });
    const from = offset + 1;
    const to = offset + schedules.length;
    return {
      schedules,
      totalSchedules,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async update(
    id: any,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ScheduleATour> {
    const updateSchedule = await this.ScheduleATourModel.findOne({
      where: { id: id },
    });
    if (!updateSchedule) {
      throw new Error('schedule not found');
    }
    await updateSchedule.update(updateScheduleDto, { where: { id: id } });
    return updateSchedule;
  }

  async deleteScheduleById(id: number): Promise<{ message: string }> {
    const result = await this.ScheduleATourModel.destroy({ where: { id } });
    if (result) {
      return { message: 'schedule removed successfully' };
    } else {
      return { message: 'schedule not found' };
    }
  }
  async searchTour(query: { search?: string }): Promise<any> {
    const whereConditions: any = {};
    if (query.search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
        { phone: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const tours = await this.ScheduleATourModel.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
    });

    return {
      tours: tours,
    };
  }

  async updateScheduleByIdAndOwner(
    id: number,
    ownerId: number,
    updateData: { is_replied: boolean; reply_replied: string },
  ): Promise<any> {
    const [updated] = await this.ScheduleATourModel.update(
      {
        is_replied: updateData.is_replied,
        reply_replied: updateData.reply_replied,
      },
      {
        where: { id, property_owner: ownerId },
      },
    );

    if (updated) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Schedule updated successfully.',
      };
    } else {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Schedule not found for the given id and ownerId.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
