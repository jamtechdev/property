import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import Moderator from 'models/moderator.model';
import {
  CreateCountyPaymentDto,
  CreateModeratorDto,
  CreateTicketSystemDto,
  CreateWaitingListModeratorDto,
} from 'src/dto/moderator/moderator.dto';
import { ModeratorService } from 'src/services/moderator/moderator/moderator.service';
import AutoPublishedProperty from 'models/autopublished.property.model';
import TicketSystem from 'models/ticketsystem.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import { CreateRatingDto } from 'src/dto/moderator/moderator.dto';

@Controller('moderator')
export class ModeratorController {
  constructor(private readonly moderatorsService: ModeratorService) {}

  @Post('add-moderator')
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() createModeratorDto: CreateModeratorDto,
    @Body() createWaitingListModeratorDto: CreateWaitingListModeratorDto,
  ) {
    try {
      const moderator = await this.moderatorsService.create(
        createModeratorDto,
        createWaitingListModeratorDto,
      );
      return moderator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('update-moderator/:id')
  // @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @Body() CreateCountyPaymentDto: any,
  ) {
    try {
      const moderator = await this.moderatorsService.update(
        id,
        updateUserDto,
        CreateCountyPaymentDto,
      );
      return moderator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('moderatorById')
  @UseGuards(AuthGuard('jwt'))
  async getModeratorByUserId(
    @Query('userId', ParseIntPipe) userId: number,
    @Req() req: Request,
  ): Promise<Moderator> {
    const moderator = await this.moderatorsService.findByUserId(userId);
    if (!moderator) {
      throw new NotFoundException(`Moderator with userId ${userId} not found`);
    }

    return moderator;
  }

  @Get('moderator-pay-amount')
  @UseGuards(AuthGuard('jwt'))
  async getModeratorToPayAmount(
    @Query('moderatorId', ParseIntPipe) moderatorId: number,

    @Req() req: Request,
  ): Promise<{
    autoPublishedProperties: AutoPublishedProperty[];
    totalAmount: number;
  }> {
    const result =
      await this.moderatorsService.findModeratorToPayAmount(moderatorId);
    if (
      !result.autoPublishedProperties ||
      result.autoPublishedProperties.length === 0
    ) {
      throw new NotFoundException(
        `Moderator with userId ${moderatorId} not found`,
      );
    }

    return result;
  }

  @Post('ticketSystem')
  @UseGuards(AuthGuard('jwt'))
  async createTicketSystem(
    @Body() createTicketSystemDto: CreateTicketSystemDto,
  ) {
    try {
      const ticketSystem = await this.moderatorsService.createTicketSystem(
        createTicketSystemDto,
      );
      return ticketSystem;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('all-ticketSystem')
  @UseGuards(AuthGuard('jwt'))
  async findTicketSystem(
    @Query()
    paginationDto: PaginationDto,
  ): Promise<any> {
    const allTicketSystem =
      await this.moderatorsService.findAllTicketSystem(paginationDto);
    if (!allTicketSystem) {
      throw new NotFoundException(`all ticket system not found`);
    }
    return allTicketSystem;
  }

  @Get('ticketSystemById')
  @UseGuards(AuthGuard('jwt'))
  async getTicketSystemById(
    @Query('moderatorId', ParseIntPipe) moderatorId: number,
    @Query() paginationDto: PaginationDto,
    @Req() req: Request,
  ): Promise<TicketSystem[]> {
    const ticketSystem = await this.moderatorsService.findById(
      moderatorId,
      paginationDto,
    );
    if (!ticketSystem) {
      throw new NotFoundException('ticket system not found');
    }
    return ticketSystem;
  }

  @Get('ticketSystemByUserId')
  @UseGuards(AuthGuard('jwt'))
  async getTicketSystemByUserId(
    @Query('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
    @Req() req: Request,
  ): Promise<TicketSystem[]> {
    const ticketSystem = await this.moderatorsService.findByUsersId(
      userId,
      paginationDto,
    );
    if (!ticketSystem) {
      throw new NotFoundException('ticket system not found');
    }
    return ticketSystem;
  }

  @Put('ticket-system/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateTicketSystem(
    @Param('id') id: string,
    @Body() updateTicketSystemDto: CreateTicketSystemDto,
  ) {
    try {
      const ticketSystem = await this.moderatorsService.updateTicketSystem(
        id,
        updateTicketSystemDto,
      );
      return ticketSystem;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('ticket-system/search')
  @UseGuards(AuthGuard('jwt'))
  async searchUsers(@Query('search') search: string) {
    const result = await this.moderatorsService.searchTicketSystem({ search });
    return result;
  }

  @Get('all-waiting-list-moderator')
  @UseGuards(AuthGuard('jwt'))
  async findWaitingListModerator(
    @Query()
    paginationDto: PaginationDto,
  ): Promise<any> {
    const allWaitingListModerator =
      await this.moderatorsService.findAllWaitingListModerator(paginationDto);
    if (!allWaitingListModerator) {
      throw new NotFoundException(`all waitingList Moderator not found`);
    }
    return allWaitingListModerator;
  }

  @Post('waiting-list-moderator/:id')
  @UseGuards(AuthGuard('jwt'))
  async approveModerator(@Param('id') id: number): Promise<any> {
    try {
      const approveWaitingListModerator =
        await this.moderatorsService.approveWaitingListModerator(id);
      return {
        approveWaitingListModerator,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-waiting-list-moderator/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getModeratorById(@Param('userId') userId: number): Promise<any> {
    try {
      const moderator =
        await this.moderatorsService.findWaitingListModeratorById(userId);
      if (!moderator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Wainting list moderator not found',
          data: moderator,
        };
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Wainting list moderator retrieved successfully',
        data: moderator,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('add-rating/:id')
  @UseGuards(AuthGuard('jwt'))
  async createRating(
    @Param('id') id: number,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return await this.moderatorsService.createRating(createRatingDto, id);
  }

  @Get('get-rating-moderator/:moderatorId')
  async getRatingsByModeratorId(@Param('moderatorId') moderatorId: number) {
    return await this.moderatorsService.findRatingsByModeratorId(moderatorId);
  }

  @Put('county-payment/:moderatorId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK) // Set the status code to 200 OK
  async updateByModeratorId(
    @Param('moderatorId') moderatorId: number,
    @Body() updateCountyPaymentDto: CreateCountyPaymentDto,
  ) {
    const updatedPayment = await this.moderatorsService.updateByModeratorId(
      moderatorId,
      updateCountyPaymentDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'County Payment updated successfully',
      data: updatedPayment,
    };
  }

  @Get('get-payment/:moderatorId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK) // Explicitly set the status code to 200 OK
  async getByModeratorId(@Param('moderatorId') moderatorId: number) {
    const countyPayment =
      await this.moderatorsService.findPaymentByModeratorId(moderatorId);
    return {
      statusCode: HttpStatus.OK,
      message: 'County Payment retrieved successfully',
      data: countyPayment,
    };
  }

  @Get('waiting-moderators/search')
  async searchWaitingModerators(@Query('search') search: string) {
    const result = await this.moderatorsService.searchWaitingModerators({
      search,
    });
    return result;
  }

  @Get('get-all-auction-moderator/:countyId')
  @UseGuards(AuthGuard('jwt'))
  async getAuctionsByCountyId(
    @Param('countyId', ParseIntPipe) countyId: number,
  ): Promise<any> {
    try {
      const auctions = await this.moderatorsService.findByCountyId(countyId);

      if (auctions.length === 0) {
        return {
          statusCode: HttpStatus.NO_CONTENT,
          message: 'No auctions found for the specified county ID.',
          data: [],
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Auctions retrieved successfully.',
        data: auctions,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while retrieving auctions.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('auction/:countyId/:userId')
  @UseGuards(AuthGuard('jwt'))
  async updateAuction(
    @Param('countyId') countyId: number,
    @Param('userId') userId: number,
    @Body() price: any,
  ): Promise<any> {
    try {
      const updatedAuction =
        await this.moderatorsService.updateAuctionPriceByCountyIdAndUserId(
          countyId,
          userId,
          price,
        );
      return {
        statusCode: HttpStatus.OK,
        message: 'Auction updated successfully.',
        data: updatedAuction,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'An error occurred while updating the auction.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-moderator-from-auction')
  @UseGuards(AuthGuard('jwt')) // Optional: Use auth guard if needed
  async handleCreateModeratorFromAuction(): Promise<any> {
    return await this.moderatorsService.createModeratorFromAuction();
  }
}
