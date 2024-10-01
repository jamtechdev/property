import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { create } from 'domain';
import AutoPublishedProperty from 'models/autopublished.property.model';
import { Moderator } from 'models/moderator.model';
import PropertyList from 'models/propertylist.model';
import {
  CreateCountyPaymentDto,
  CreateModeratorDto,
  CreateTicketSystemDto,
  CreateWaitingListModeratorDto,
} from 'src/dto/moderator/moderator.dto';
import { User } from 'models/user.model';
import TicketSystem from 'models/ticketsystem.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Op, fn, col, where } from 'sequelize';
import WaitingListModerator from 'models/waitinglistmoderator.model';
import { TwilioService } from 'src/twilio/twilio.service';
import { MailerService } from '@nestjs-modules/mailer';
import ModeratorRating, {
  moderatorRating,
} from 'models/moderator.rating.model';
import { CreateRatingDto } from 'src/dto/moderator/moderator.dto';
import CountyPayment from 'models/county.payment.model';
import County from 'models/admin/county.model';
import CountyAuction from 'models/county.auction.model';
import * as cron from 'node-cron';

@Injectable()
export class ModeratorService {
  constructor(
    @InjectModel(Moderator)
    private readonly moderatorModel: typeof Moderator,
    @InjectModel(AutoPublishedProperty)
    private readonly autoPublishedPropertyModel: typeof AutoPublishedProperty,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(TicketSystem)
    private readonly ticketSystemModel: typeof TicketSystem,
    @InjectModel(WaitingListModerator)
    private readonly waitingListModeratorModel: typeof WaitingListModerator,
    private readonly mailerService: MailerService,
    private readonly twilioService: TwilioService,
    @InjectModel(ModeratorRating)
    private readonly ratingModel: typeof ModeratorRating,
    @InjectModel(CountyPayment)
    private readonly countyPayment: typeof CountyPayment,
    @InjectModel(CountyAuction)
    private readonly countyAuction: typeof CountyAuction,
  ) {
    this.scheduleDailyTask();
  }

  async create(
    createModeratorDto: CreateModeratorDto,
    createWaitingListModeratorDto: CreateWaitingListModeratorDto,
  ): Promise<any> {
    // Check if a moderator with the same userId and county already exists
    const existingModerator = await this.moderatorModel.findOne({
      where: {
        userId: createModeratorDto.userId,
        county: createModeratorDto.county,
      },
    } as any);
    if (existingModerator) {
      throw new HttpException(
        'Moderator with same userId and county already exists',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Check if the email already exists in the Moderator model
    const emailExists = await this.moderatorModel.findOne({
      where: {
        email: createModeratorDto.email,
      },
    });

    if (emailExists) {
      throw new HttpException(
        'Email already exists in Moderator',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Find the user and update is_moderator field
    const user = await this.userModel.findOne({
      where: { id: createModeratorDto.userId },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // Check if the county already has a moderator
    const countyModerator = await this.moderatorModel.findOne({
      where: {
        county: createModeratorDto.county,
      },
    });

    if (countyModerator) {
      const waitingListModerator = await this.waitingListModeratorModel.create(
        createWaitingListModeratorDto,
      );
      return {
        statusCode: 201,
        message: 'waiting List moderator created successfully ',
        waitingListModerator,
      };
    }
    // user.is_moderator = true;
    await user.save();
    const moderator = await this.moderatorModel.create(createModeratorDto);
    const countyId = parseInt(moderator.county);
    await this.countyPayment.create({
      moderatorId: moderator.id,
      countyId: countyId,
    });
    return moderator;
  }

  async update(
    id: any,
    updateUserDto: any,
    CreateCountyPaymentDto: any,
  ): Promise<Moderator> {
    const moderator = await this.moderatorModel.findByPk(id);
    if (!moderator) {
      throw new Error('Moderator not found');
    }
    // Update the "status" field directly
    if (updateUserDto.status == 'approved') {
      moderator.status = updateUserDto.status;
      moderator.is_active_status = true;
      moderator.is_deleted = false;
      await this.userModel.update(
        { is_moderator: true },
        {
          where: { id: moderator.userId },
        },
      );
      CreateCountyPaymentDto.moderatorId = moderator.id;
      CreateCountyPaymentDto.countyId = moderator.county;
      await this.countyPayment.create(CreateCountyPaymentDto);
    } else {
      moderator.status == 'pending';
      moderator.is_active_status = false;
      moderator.is_deleted = true;
      await this.userModel.update(
        { is_moderator: false },
        {
          where: { id: moderator.userId },
        },
      );
      await this.moderatorModel.destroy({
        where: { id },
      });
      const waitingListModerators =
        await this.waitingListModeratorModel.findAll({
          where: { county: moderator.county },
        });
      // Store each waiting list moderator in the CountyAuction model
      for (const waitingListModerator of waitingListModerators) {
        const existingAuction = await this.countyAuction.findOne({
          where: {
            countyId: waitingListModerator.county,
            userId: waitingListModerator.userId,
          },
        });
        const countyAuctionData = {
          countyId: waitingListModerator.county,
          userId: waitingListModerator.userId,
          price: 499,
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
        await this.countyAuction.create(countyAuctionData);
      }
      for (const waitingListModerator of waitingListModerators) {
        const user = waitingListModerator.user;
        if (user && user.email) {
          await this.mailerService.sendMail({
            to: user.email,
            subject: 'Auction county for moderator',
            html: `Auction on this county has been started. The end date of the auction will be after 7 days.`,
          });
        }
      }
    }
    await moderator.save({ validate: false });
    return moderator;
  }

  async findByUserId(userId: number): Promise<Moderator> {
    const moderator = await this.moderatorModel.findOne({ where: { userId } });
    if (!moderator) {
      throw new NotFoundException(`Moderator with userId ${userId} not found`);
    }
    return moderator;
  }
  async findModeratorToPayAmount(moderatorId: number): Promise<{
    autoPublishedProperties: AutoPublishedProperty[];
    totalAmount: number;
  }> {
    const autoPublishedProperties =
      await this.autoPublishedPropertyModel.findAll({
        include: PropertyList,
        where: {
          moderatorId: moderatorId,
          is_payment_status: false,
        },
      });
    if (!autoPublishedProperties || autoPublishedProperties.length === 0) {
      throw new NotFoundException(
        `Moderator with userId ${moderatorId} not found`,
      );
    }
    const totalAmount = autoPublishedProperties.reduce(
      (sum, item) => sum + parseFloat(item.auto_published_charge),
      0,
    );
    return { autoPublishedProperties, totalAmount };
  }

  async createTicketSystem(
    createTicketSystemDto: CreateTicketSystemDto,
  ): Promise<any> {
    const ticketSystem = await this.ticketSystemModel.create(
      createTicketSystemDto,
    );
    return {
      statusCode: 201,
      message: 'create ticket system successfully',
      ticketSystem: ticketSystem,
    };
  }

  async findAllTicketSystem(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalTicketSystem = await this.ticketSystemModel.count();
    const totalPages = Math.ceil(totalTicketSystem / parsedLimit);
    const ticketSystems = await this.ticketSystemModel.findAll({
      include: [
        {
          model: Moderator,
          attributes: { exclude: ['createdAt', 'updatedAt'] },

          include: [
            {
              model: User,
              attributes: ['username', 'email'],
            },
          ],
        },
        { model: User },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parsedLimit,
    });
    const from = offset + 1;
    const to = offset + ticketSystems.length;
    if (!ticketSystems) {
      return {
        ticketSystems,
        totalTicketSystem,
        currentPage: parsedPage,
        totalPages,
        from,
        to,
      };
    }
    return {
      statusCode: 200,
      message: 'all ticket system  find successfully',
      ticketSystems,
      totalTicketSystem,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async findById(
    moderatorId: number,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalTicketSystem = await this.ticketSystemModel.count({
      where: { moderatorId: moderatorId },
    });
    const totalPages = Math.ceil(totalTicketSystem / parsedLimit);
    const ticketSystem = await this.ticketSystemModel.findAll({
      where: { moderatorId: moderatorId },
      offset,
      limit: parsedLimit,
    });
    const from = offset + 1;
    const to = offset + ticketSystem.length;
    if (!ticketSystem) {
      throw new NotFoundException('ticket system not found');
    }
    return {
      statusCode: 200,
      message: 'find ticket system successfully',
      ticketSystem,
      totalTicketSystem,
      totalPages,
      currentPage: parsedPage,
      from,
      to,
    };
  }

  async findByUsersId(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalTicketSystem = await this.ticketSystemModel.count({
      where: { userId: userId },
    });
    const totalPages = Math.ceil(totalTicketSystem / parsedLimit);
    const ticketSystem = await this.ticketSystemModel.findAll({
      where: { userId: userId },
      offset,
      limit: parsedLimit,
    });
    const from = offset + 1;
    const to = offset + ticketSystem.length;
    if (!ticketSystem) {
      throw new NotFoundException('ticket system not found');
    }
    return {
      statusCode: 200,
      message: 'find ticket system successfully',
      ticketSystem,
      totalTicketSystem,
      totalPages,
      currentPage: parsedPage,
      from,
      to,
    };
  }

  async updateTicketSystem(
    id: any,
    updateTicketSystemDto: CreateTicketSystemDto,
  ): Promise<any> {
    const ticketSystem = await this.ticketSystemModel.findByPk(id);
    if (!ticketSystem) {
      throw new Error('ticket system not found');
    }
    await ticketSystem.update(updateTicketSystemDto);
    return {
      statusCode: 200,
      message: 'ticket system status update successfully',
      ticketSystem,
    };
  }

  async searchTicketSystem(query: { search?: string }): Promise<any> {
    const whereConditions: any = {};
    if (query.search) {
      whereConditions[Op.or] = [
        { '$moderator.user.username$': { [Op.like]: `%${query.search}%` } },
        { '$moderator.user.email$': { [Op.like]: `%${query.search}%` } },
        { description: { [Op.like]: `%${query.search}%` } },
      ];
    }
    const ticketSystem = await this.ticketSystemModel.findAll({
      include: [
        {
          model: Moderator,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
          include: [
            {
              model: User,
              attributes: ['username', 'email'],
            },
          ],
        },
      ],
      where: whereConditions,
      order: [['createdAt', 'DESC']],
    });

    return {
      ticketSystem: ticketSystem,
    };
  }

  async findAllWaitingListModerator(
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalWaitingListModerator =
      await this.waitingListModeratorModel.count();
    const totalPages = Math.ceil(totalWaitingListModerator / parsedLimit);
    const waitingListModerators = await this.waitingListModeratorModel.findAll({
      include: [
        {
          model: User,
          attributes: ['username', 'mobile', 'email'],
        },
        { model: County, attributes: ['countyName'] },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + waitingListModerators.length;
    const emailPromises = waitingListModerators.map((moderator) => {
      return this.mailerService
        .sendMail({
          to: moderator.email,
          subject: 'Waiting List Moderator Notification',
          html: `
        <p>Dear ${moderator.user.username},</p>
        <p>You are on the waiting list. We will notify you when a position becomes available.</p>
        <p>Best regards,<br>The Team</p>
      `,
        })
        .catch((emailError) => {
          console.error(
            `Error sending email to ${moderator.email}:`,
            emailError,
          );
        });
    });
    try {
      await Promise.all([...emailPromises]);
      console.log(' emails sent successfully.');
    } catch (sendAllError) {
      throw new HttpException(
        'Failed to  emails',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      statusCode: 200,
      message: 'All waiting list moderators found and sent email successfully',
      waitingListModerators,
      totalWaitingListModerator,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async approveWaitingListModerator(
    waitingListModeratorId: number,
  ): Promise<any> {
    const waitingListModerator = await this.waitingListModeratorModel.findByPk(
      waitingListModeratorId,
    );

    if (!waitingListModerator) {
      throw new HttpException(
        'WaitingListModerator not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const existingModerator = await this.moderatorModel.findOne({
      where: { county: waitingListModerator.county },
    });

    if (existingModerator) {
      throw new HttpException(
        'Moderator with the same county already exists please wait!',
        HttpStatus.CONFLICT,
      );
    }
    const approveWaitingListModerator = await this.moderatorModel.create({
      state: waitingListModerator.state,
      county: waitingListModerator.county,
      fee_to_pay: waitingListModerator.fee_to_pay,
      status: 'approved',
      noOfSoldProp: waitingListModerator.noOfSoldProp,
      noOfHoldProp: waitingListModerator.noOfHoldProp,
      noOfDeclinedProp: waitingListModerator.noOfDeclinedProp,
      email: waitingListModerator.email,
      userId: waitingListModerator.userId,
      is_active_status: true,
    });
    const countyId = existingModerator.county;
    await this.countyPayment.create({
      moderatorId: existingModerator.id,
      countyId: countyId,
    });
    await this.userModel.update(
      { is_moderator: true },
      {
        where: { id: waitingListModerator.userId },
      },
    );
    await waitingListModerator.destroy();

    return {
      statusCode: 200,
      message:
        'Waiting list moderator approved and transferred to the Moderator table successfully.',
      approveWaitingListModerator,
    };
  }

  async findWaitingListModeratorById(userId: number): Promise<any> {
    const waitingListModerator = await this.waitingListModeratorModel.findOne({
      where: { userId: userId },
      include: [
        { model: County, attributes: ['countyName'] },
        {
          model: User,
          attributes: { exclude: ['createdAt', 'updatedAt', 'password'] },
        },
      ],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    if (!waitingListModerator) {
      throw new HttpException(
        'Waiting list moderator not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const countyId = waitingListModerator.county;
    const assignedModerator = await this.moderatorModel.findOne({
      where: { county: countyId, is_active_status: true, is_deleted: false },
    });
    // Determine if the county is free or busy
    const countyStatus = assignedModerator ? 'busy' : 'free';
    return {
      waitingListModerator,
      countyStatus,
    };
  }

  async createRating(
    createRatingDto: CreateRatingDto,
    id: number,
  ): Promise<any> {
    const moderator = await this.moderatorModel.findOne({
      where: { id: id },
    });

    if (!moderator) {
      throw new NotFoundException('Moderator not found');
    }
    const existingRating = await this.ratingModel.findOne({
      where: {
        userId: createRatingDto.userId,
        moderatorId: createRatingDto.moderatorId,
      },
    });

    if (existingRating) {
      throw new BadRequestException(
        'A rating for this User ID and Moderator ID already exists',
      );
    }
    const newRating = await this.ratingModel.create(createRatingDto);
    return {
      status: HttpStatus.CREATED,
      message: 'Rating created successfully',
      data: newRating,
    };
  }

  async findRatingsByModeratorId(moderatorId: number): Promise<any> {
    const ratings = await this.moderatorModel.findAll({
      where: { id: moderatorId },
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },

      include: [
        {
          model: User,
          attributes: ['username', 'mobile'],
        },
        {
          model: moderatorRating,
          attributes: {
            exclude: ['createdAt', 'updatedAt'],
          },
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'mobile', 'email', 'image'],
            },
          ],
        },
      ],
    });

    return {
      status: HttpStatus.OK,
      message: 'Ratings retrieved successfully',
      data: ratings,
    };
  }

  async updateByModeratorId(
    moderatorId: number,
    updateCountyPaymentDto: CreateCountyPaymentDto,
  ): Promise<CountyPayment> {
    const countyPayment = await this.countyPayment.findOne({
      where: { moderatorId },
    });
    if (!countyPayment) {
      throw new HttpException(
        'CountyPayment record not found for this moderator',
        HttpStatus.NOT_FOUND,
      );
    }
    countyPayment.last_pay_date = updateCountyPaymentDto.last_pay_date;
    countyPayment.next_pay_date = updateCountyPaymentDto.next_pay_date;
    countyPayment.default_pay = updateCountyPaymentDto.default_pay;
    countyPayment.county_pay = true;
    await countyPayment.save();

    return countyPayment;
  }

  async findPaymentByModeratorId(moderatorId: number): Promise<CountyPayment> {
    const countyPayment = await this.countyPayment.findOne({
      where: { moderatorId },
    });

    if (!countyPayment) {
      throw new NotFoundException('County Payment not found');
    }

    return countyPayment;
  }

  async searchWaitingModerators(query: { search?: string }): Promise<any> {
    const whereConditions: any = {};
    if (query.search) {
      whereConditions[Op.or] = [
        { '$user.username$': { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
        { '$user.mobile$': { [Op.like]: `%${query.search}%` } },
      ];
    }

    const waitingListModerator = await this.waitingListModeratorModel.findAll({
      include: [
        {
          model: User,
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'password'],
          },
        },
      ],
      where: whereConditions,
      order: [['createdAt', 'DESC']],
    });

    return {
      waitingListModerator: waitingListModerator,
    };
  }

  async findByCountyId(countyId: number): Promise<CountyAuction[]> {
    return this.countyAuction.findAll({
      where: { countyId },
      include: [
        { model: County, attributes: ['countyName', 'county_fee'] },
        {
          model: User,

          attributes: {
            exclude: ['createdAt', 'updatedAt', 'password'],
          },
        },
      ],
    });
  }

  async updateAuctionPriceByCountyIdAndUserId(
    countyId: number,
    userId: number,
    price: any,
  ): Promise<CountyAuction> {
    const auction = await this.countyAuction.findOne({
      where: { countyId, userId },
      include: [
        {
          model: User,
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'password'],
          },
        },
      ],
    });

    if (!auction) {
      throw new HttpException(
        'County auction record not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    await auction.update(price);
    return auction;
  }

  private scheduleDailyTask() {
    cron.schedule('0 0 * * *', async () => {
      console.log('Running scheduled task at:', new Date());
      await this.createModeratorFromAuction();
    });
  }

  async createModeratorFromAuction(): Promise<any> {
    console.log(new Date());
    try {
      const expiredAuctions = await this.countyAuction.findAll({
        where: {
          end_date: {
            [Op.lte]: new Date(),
          },
        },
      });

      if (expiredAuctions.length === 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'No expired auctions found',
        };
      }

      for (const auction of expiredAuctions) {
        const maxBidUser = await this.countyAuction.findOne({
          where: { countyId: auction.countyId },
          order: [['price', 'DESC']],
        });

        if (maxBidUser) {
          const newModerator = await this.waitingListModeratorModel.findOne({
            where: {
              userId: String(maxBidUser.userId),
            },
          });
          await this.moderatorModel.create({
            state: newModerator.state,
            fee_to_pay: 100,
            email: newModerator.email,
            userId: Number(maxBidUser.userId),
            county: String(maxBidUser.countyId),
            status: 'pending',
            is_active_status: false,
            is_deleted: false,
          });
          // Assign the moderatorId to the DTO
          const countyId = newModerator.county;
          await this.countyPayment.create({
            moderatorId: newModerator.id,
            countyId: countyId,
          });
          await this.userModel.update(
            { is_moderator: true },
            {
              where: { id: newModerator.userId },
            },
          );
          await this.countyAuction.destroy({
            where: { countyId: maxBidUser.countyId },
          });
          await this.waitingListModeratorModel.destroy({
            where: {
              county: String(maxBidUser.countyId),
            },
          });
          const user = await this.userModel.findByPk(Number(maxBidUser.userId));
          if (user && user.email) {
            await this.mailerService.sendMail({
              to: user.email,
              subject: 'Congratulations! You are now a moderator',
              html: `You have been selected as the moderator for county ${maxBidUser.countyId} based on your bid.`,
            });
          }
          await this.mailerService.sendMail({
            to: 'admin@rehabloop.com',
            subject: 'New Moderator Selected',
            html: `
              <p>Dear Admin,</p>
              <p>A new moderator has been selected based on the highest bid.</p>
              <p><strong>County:</strong> ${maxBidUser.county}</p>
              <p><strong>User ID:</strong> ${maxBidUser.userId}</p>
              <p>The user has been notified and their status has been updated accordingly.</p>
              <p>Regards,</p>
              <p>Your System</p>
            `,
          });
        }
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Moderators created successfully from expired auctions',
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
