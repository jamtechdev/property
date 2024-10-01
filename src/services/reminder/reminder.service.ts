import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Reminder from 'models/reminder.model';
import User from 'models/user.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import { CreateReminderDto } from 'src/dto/reminder/reminder.dto';
import { Op } from 'sequelize';

@Injectable()
export class ReminderService {
    constructor(
        @InjectModel(Reminder)
        private readonly reminderModel: typeof Reminder,
    ) { }
    async createReminder(createReminderDto: CreateReminderDto): Promise<Reminder> {
        const createdReminder = await this.reminderModel.create(createReminderDto);
        return createdReminder;
    }

    async findByUserId(userId: number, paginationDto: PaginationDto): Promise<any> {
        const { page, limit } = paginationDto;
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const offset = (parsedPage - 1) * parsedLimit
        const totalReminder = await this.reminderModel.count({ where: { userId: userId } });
        const totalPages = Math.ceil(totalReminder / parsedLimit);
        const reminders = await this.reminderModel.findAll({
            where: { userId: userId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username']
                }
            ],
            offset,
            limit: parsedLimit,
        });
        const from = offset + 1;
        const to = offset + reminders.length;
        if (!reminders) {
            throw new NotFoundException(`blog not found ${userId}`)
        }
        return {
            reminders,
            totalReminder,
            totalPages,
            currentPage: parsedPage,
            from,
            to,
        };
    }

    async searchTasks(userId: number, description: string, paginationDto: PaginationDto): Promise<any> {
        const { page, limit } = paginationDto;
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const offset = (parsedPage - 1) * parsedLimit
        const totalReminderTask = await this.reminderModel.count({ where: { userId: userId ,description: {
            [Op.like]: `%${description}%`
        },} });
        const totalPages = Math.ceil(totalReminderTask / parsedLimit);
        const taskReminder = await this.reminderModel.findAll({
            where: {
                userId: userId,
                description: {
                    [Op.like]: `%${description}%`
                },
            },
            offset,
            limit: parsedLimit,
        });
        const from = offset + 1;
        const to = offset + taskReminder.length;

        return {
            taskReminder,
            totalReminderTask,
            totalPages,
            currentPage: parsedPage,
            from,
            to,
        };

    }
}