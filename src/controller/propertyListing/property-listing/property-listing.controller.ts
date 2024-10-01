/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Patch,
  Param,
  BadRequestException,
  NotFoundException,
  Delete,
  Req,
  Put,
  ParseIntPipe,
  Res,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropertyListService } from '../../../services/propertyListing/property-listing/property-listing.service';
import {
  CreateLeadDto,
  CreatePropertyListDto,
  StartBidingDto,
} from '../../../dto/propertyListing/property-listing/property-listing.dto';
import slugify from 'slugify';
import { Response } from 'express';
import PropertyList from 'models/propertylist.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import { ReviewService } from 'src/services/review/review.service';
import { CreateReviewDto } from 'src/dto/review/review.dto';
import { PropertyInformationDto } from 'src/dto/propertyInformation/propertyInformation.dto';
import { PropertyInformationService } from 'src/services/property-information/property-information.service';
import PropertyInformation from 'models/propertyinformation.model';
import Lead from 'models/leads.model';

@Controller('property')
export class PropertyListController {
  constructor(
    private readonly propertyListService: PropertyListService,
    private readonly reviewService: ReviewService,
    private readonly propertyInformationService: PropertyInformationService,
  ) {}

  @Get('get-property-by-slug/:slug')
  async getPropertyBySlug(
    @Param('slug') slug: string,
    @Query('userId') userId: number,
  ): Promise<PropertyList> {
    const property = await this.propertyListService.findOneBySlug(slug, userId);
    if (!property) {
      throw new NotFoundException(`Property with ${slug} not found`);
    }
    return property;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('add-property')
  async create(@Body() createPropertyListDto: CreatePropertyListDto) {
    try {
      function addHyphenIfMultipleWords(input: string): string {
        if (!input) return '';

        // Replace spaces and slashes with hyphens, then convert to lowercase
        return input
          .replace(/[\s/,]+/g, '-')
          .replace(/[^a-zA-Z0-9-]/g, '-') // Replace spaces and slashes with hyphens
          .toLowerCase(); // Convert to lowercase
      }

      const slugStr =
        'wholesale-properties-' +
        addHyphenIfMultipleWords(createPropertyListDto?.address);
      createPropertyListDto.slug = slugStr;

      const result = await this.propertyListService.create(
        createPropertyListDto,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Property created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-properties')
  async getPropertyList(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('price_min') price_min: number,
    @Query('price_max') price_max: number,
    @Query('type') type: string,
    @Query('propertyId') propertyId: string,
    @Query('bedrooms') bedrooms: number,
    @Query('bathrooms') bathrooms: number,
    @Query('location') location: string,
    @Query('square_min') square_min: number,
    @Query('square_max') square_max: number,
    @Query('listed_in') listed_in: string,
    @Query('sortBy') sortBy: string,
    @Query('other_features') other_features: any,
    @Query('state') state: number,
    @Query('county') county: number,
    @Query('userId') userId: number,
  ): Promise<any> {
    try {
      const properties = await this.propertyListService.getPropertyList(
        page,
        limit,
        price_min,
        price_max,
        type,
        propertyId,
        bedrooms,
        bathrooms,
        location,
        square_min,
        square_max,
        listed_in,
        sortBy,
        other_features,
        state,
        county,
        userId,
      );
      return {
        statusCode: HttpStatus.OK,
        properties,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('update-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: number,
    @Body() updatePropertyListDto: CreatePropertyListDto,
  ) {
    const updatedProperty = await this.propertyListService.update(
      id,
      updatePropertyListDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Property updated successfully',
      property: updatedProperty,
    };
  }
  @Get('get-nearby-property')
  async getNearbyProperties(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('price_min') price_min: number,
    @Query('price_max') price_max: number,
    @Query('type') type: string,
    @Query('propertyId') propertyId: string,
    @Query('bedrooms') bedrooms: number,
    @Query('bathrooms') bathrooms: number,
    @Query('location') location: string,
    @Query('square_min') square_min: number,
    @Query('square_max') square_max: number,
    @Query('listed_in') listed_in: string,
    @Query('sortBy') sortBy: string,
    @Query('other_features') other_features: any,
    @Query('state') state: number,
    @Query('county') county: number,
    @Query('userId') userId: number,
    @Query('latitude') latitude?: number, // New parameter
    @Query('longitude') longitude?: number, // New parameter
  ): Promise<any> {
    try {
      const properties = await this.propertyListService.findPropertiesNearby(
        page,
        pageSize,
        price_min,
        price_max,
        type,
        propertyId,
        bedrooms,
        bathrooms,
        location,
        square_min,
        square_max,
        listed_in,
        sortBy,
        other_features,
        state,
        county,
        userId,
        latitude, // Pass new parameter
        longitude, // Pass new parameter
      );
      return {
        statusCode: HttpStatus.OK,
        properties,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('status')
  @UseGuards(AuthGuard('jwt'))
  async autoPublish(): Promise<any> {
    return this.propertyListService.autoPublish();
  }

  @Get('propertyByCountyId')
  @UseGuards(AuthGuard('jwt'))
  async getPropertiesByCountyId(
    @Query('countyId') countyId: string,
    @Query() paginationDto: PaginationDto,
    @Req() req: Request,
  ): Promise<{
    properties: PropertyList[];
    totalCountry: any;
    totalPages: any;
    currentPage;
  }> {
    const parsedCountyId = parseInt(countyId, 10);
    if (isNaN(parsedCountyId)) {
      throw new BadRequestException('Invalid countyId');
    }
    const properties = await this.propertyListService.findByCountyId(
      parsedCountyId,
      paginationDto,
    );
    return properties;
  }

  @Get('get-properties-by-location')
  async getPropertyListByLocation(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string,
  ): Promise<any> {
    try {
      // Fetch properties with search and pagination applied
      const { properties, totalPages, totalProperties, currentPage } =
        await this.propertyListService.getPropertyListByLocation(
          page,
          limit,
          search,
        );

      return {
        statusCode: HttpStatus.OK,
        properties,
        totalPages,
        currentPage,
        totalProperties,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async getPropertiesById(@Param('id') id: number): Promise<PropertyList> {
    console.log(id);
    const property = await this.propertyListService.findById(id);
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
    return property;
  }

  @Get('get-properties-by-owner')
  @UseGuards(AuthGuard('jwt'))
  async getPropertiesByOwner(
    @Query('id') id: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    try {
      const result = await this.propertyListService.findByWonerId(
        id,
        page,
        limit,
      );
      return {
        statusCode: 200,
        message: 'Properties fetched successfully',
        data: result,
      };
    } catch (error) {
      console.log(error);
      throw new NotFoundException(
        `Properties for owner with ID ${id} not found`,
      );
    }
  }

  @Post('post-save-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async savePropertiesById(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ): Promise<PropertyList> {
    const property = await this.propertyListService.findAndSaveById(id, userId);
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
    return property;
  }

  @Get('get-save-property')
  @UseGuards(AuthGuard('jwt'))
  async getSavePropertiesByUserId(
    @Query('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const properties = await this.propertyListService.findSavePropertyByUserId(
      userId,
      page,
      limit,
    );
    return properties;
  }

  @Post('post-favorite-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async favoritePropertiesById(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ): Promise<PropertyList> {
    const property = await this.propertyListService.findAndSaveFavoriteById(
      id,
      userId,
    );
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
    return property;
  }

  @Get('get-favorite-property')
  @UseGuards(AuthGuard('jwt'))
  async getFavoritePropertiesByUserId(
    @Query('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const properties =
      await this.propertyListService.getFavoritePropertyByUserId(
        userId,
        page,
        limit,
      );
    return properties;
  }

  @Delete('delete-favorite-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteFavoritePropertiesById(@Param('id') id: number): Promise<any> {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    const properties =
      await this.propertyListService.findAndRemoveFavoritePropertyById(id);
    return properties;
  }

  @Delete('delete-saved-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteSavePropertiesById(@Param('id') id: number): Promise<any> {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    const properties =
      await this.propertyListService.findAndRemoveSavePropertyById(id);
    return properties;
  }

  //expiry extend property
  @Patch('expiry-extend-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async expiryExtendPropertyById(
    @Param('id') id: number,
    @Body('email') email: string,
    @Body('action_renew_property') action_renew_property: string,
  ): Promise<any> {
    if (!id) {
      throw new BadRequestException('Property ID is required');
    }

    const property =
      await this.propertyListService.findAndExpiryExtendPropertyById(
        id,
        email,
        action_renew_property,
      );
    return property;
  }

  @Get('auto-renew')
  @UseGuards(AuthGuard('jwt'))
  async autoRenewProperties(@Res() res: Response): Promise<any> {
    try {
      const result = await this.propertyListService.autoRenewProperties();
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error auto-renewing properties',
        error: error.message,
      });
    }
  }

  @Get('pay-renew-property/:propertyId')
  @UseGuards(AuthGuard('jwt'))
  async renewPropertyById(@Param('propertyId') propertyId: number) {
    try {
      const result =
        await this.propertyListService.renewPayPropertyById(propertyId);
      return result;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to auto-renew property.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-filters-property')
  async getFilteredProperties(
    @Query('price_min') price_min: number,
    @Query('price_max') price_max: number,
    @Query('type') type: string,
    @Query('propertyId') propertyId: string,
    @Query('bedrooms') bedrooms: number,
    @Query('bathrooms') bathrooms: number,
    @Query('location') location: string,
    @Query('square_min') square_min: number,
    @Query('square_max') square_max: number,
  ): Promise<any> {
    const getFilteredProperties =
      await this.propertyListService.getFilteredProperties(
        price_min,
        price_max,
        type,
        propertyId,
        bedrooms,
        bathrooms,
        location,
        square_min,
        square_max,
      );
    return getFilteredProperties;
  }
  @Patch('upgrad-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async upgradPropertiesById(@Param('id') id: number): Promise<any> {
    if (!id) {
      throw new BadRequestException('Property ID is required');
    }

    const properties =
      await this.propertyListService.findAndUpgradPropertyById(id);
    return properties;
  }

  @Delete('delete-expire-property')
  @UseGuards(AuthGuard('jwt'))
  async deleteExpiredProperty(): Promise<any> {
    const properties =
      await this.propertyListService.findAndDeleteExpiredProperty();
    return properties;
  }

  @Get('reminder-contracted-property')
  @UseGuards(AuthGuard('jwt'))
  async contractedProperties(): Promise<any> {
    const properties =
      await this.propertyListService.sendReminderMsgToContractedProperties();
    return properties;
  }

  @Delete('deletePropertyBySeller/:propertyId')
  @UseGuards(AuthGuard('jwt'))
  async deleteProperty(
    @Param('propertyId') propertyId: number,
    @Body('sellerId') sellerId: number,
  ): Promise<any> {
    // Assuming you have a way to get the authenticated user ID from the request

    return this.propertyListService.deletePropertyBySeller(
      propertyId,
      sellerId,
    );
  }

  @Patch('auto-published-hold-properties')
  @UseGuards(AuthGuard('jwt'))
  async autoPublishHoldProperties(): Promise<any> {
    return this.propertyListService.autoPublishHoldProperties();
  }

  @Get('searchUserProperty')
  async searchUserProperty(
    @Query('propertyName') propertyName?: string,
    @Query('postedBy') postedBy?: number,
  ): Promise<PropertyList[]> {
    return this.propertyListService.searchProperties(propertyName, postedBy);
  }

  @Post('add-review')
  @UseGuards(AuthGuard('jwt'))
  async createReview(@Body() createReviewDto: CreateReviewDto) {
    try {
      const moderator = await this.reviewService.createReviews(createReviewDto);
      return moderator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Get('get-review/:id')
  async getReviews(@Param('id') id: number) {
    try {
      const moderator = await this.reviewService.getReviews(id);
      return moderator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Put('helpfull/:id')
  // @UseGuards(AuthGuard('jwt'))
  async createHelpFullOrNot(
    @Param('id') id: number,
    @Body('helpfull') helpfull: number,
    @Body('not_helpfull') not_helpfull: number,
  ) {
    try {
      const reviews = await this.reviewService.updateHelpFullOrNot(
        id,
        helpfull,
        not_helpfull,
      );
      return reviews;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('update-review/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateReview(
    @Param('id') id: number,
    @Body() updateReviewDto: CreateReviewDto,
  ) {
    try {
      const updatedReview = await this.reviewService.update(id, {
        ...updateReviewDto,
      });
      return updatedReview;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('approve-review/:id')
  @UseGuards(AuthGuard('jwt'))
  async toggleApprovalStatus(
    @Param('id') id: number,
    @Body('propertyId') propertyId: number,
    @Body('is_approved') is_approved: boolean,
  ) {
    const updatedReview = await this.reviewService.toggleApprovalStatus(
      id,
      propertyId,
      is_approved,
    );
    if (!updatedReview) {
      throw new NotFoundException('Review not found');
    }
    return {
      message: 'Review approval status toggled successfully',
      review: updatedReview,
    };
  }

  @Post('add-information')
  @UseGuards(AuthGuard('jwt'))
  async createInformation(
    @Body() propertyInformationDto: PropertyInformationDto,
  ) {
    return this.propertyInformationService.create(propertyInformationDto);
  }

  @Get('propertyInformationById')
  @UseGuards(AuthGuard('jwt'))
  async propertyInformationById(
    @Query('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<PropertyInformation> {
    const propertyInformation =
      await this.propertyInformationService.findById(id);
    if (!propertyInformation) {
      throw new NotFoundException('propertyInformation not found');
    }
    return propertyInformation;
  }

  @Get('all_propertyInformation')
  async findPropertyInformation(
    @Query() paginationDto: PaginationDto,
  ): Promise<any> {
    const all_propertyInformation =
      await this.propertyInformationService.findAllPropertyInformation(
        paginationDto,
      );
    if (!all_propertyInformation) {
      throw new NotFoundException(`propertyInformation not found`);
    }
    return all_propertyInformation;
  }

  @Get('get-all-counties-in-propertylist')
  @UseGuards(AuthGuard('jwt'))
  async getCountiesFromPropertylist(): Promise<{ counties: string[] }> {
    const counties =
      await this.propertyListService.getCountiesFromPropertylist();
    if (!counties || counties.length === 0) {
      throw new NotFoundException(`No counties found in the property list.`);
    }
    return { counties };
  }

  @Delete('delete-property/:id')
  @UseGuards(AuthGuard('jwt'))
  async deletePropertyById(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId: number, // Extract the request to get the user information
  ) {
    // Assuming the user object is attached to the request after authentication
    const deleteProperty = await this.propertyListService.deletePropertyById(
      id,
      userId,
    );
    return deleteProperty;
  }

  @Patch('set-property-to-non-active/:id')
  @UseGuards(AuthGuard('jwt'))
  async setPropertyToNonActive(@Param('id', ParseIntPipe) id: number) {
    const result =
      await this.propertyListService.setPropertyToActiveInActive(id);
    return result;
  }

  @Post('add-property-lead')
  @HttpCode(HttpStatus.CREATED)
  // @UseGuards(AuthGuard('jwt'))
  async createLead(
    @Body() createLeadDto: CreateLeadDto,
  ): Promise<{ statusCode: number; message: string; data: Lead }> {
    const lead = await this.propertyListService.createLeads(createLeadDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Lead created successfully',
      data: lead,
    };
  }

  @Get('get-property-leads')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async getAllLeads(): Promise<{ statusCode: number; data: Lead[] }> {
    const leads = await this.propertyListService.findAll();
    return {
      statusCode: HttpStatus.OK,
      data: leads,
    };
  }

  @Get('get-property-lead/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async getLeadByUserId(
    @Param('userId') userId: number, // Accept userId as a route parameter
    @Query('page') page: number = 1, // Accept page as a query parameter with a default value of 1
    @Query('limit') limit: number = 10, // Accept limit as a query parameter with a default value of 10
  ): Promise<{
    statusCode: number;
    data: Lead[];
    totalLeads: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { leads, totalLeads } =
      await this.propertyListService.findLeadByUserId(userId, page, limit);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalLeads / limit);

    return {
      statusCode: HttpStatus.OK,
      data: leads,
      totalLeads,
      totalPages, // Include total pages in the response
      currentPage: page,
    };
  }

  @Delete('delete-property-lead/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async deleteLeadByUserId(
    @Param('id') id: number, // Accept id as a route parameter
    @Body('userId') userId: number, // Accept userId as a route parameter
  ): Promise<{
    statusCode: number;
    message: string;
  }> {
    try {
      const deletedCount = await this.propertyListService.deleteLeadsByUserId(
        id,
        userId,
      );

      if (deletedCount === 0) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No leads found for the given user ID',
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: `${deletedCount} lead(s) deleted successfully`,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('send-email-and-text-for-lead')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async sendEmailAndText(
    @Body('title') title: string, // Get title from the request body
    @Body('description') description: string, // Get description from the request body
    @Body('email') email: string, // Get email from the request body
    @Body('mobile') mobile: string,
    @Body('email_user') email_user: string, // Get mobile number from the request body
  ): Promise<{
    statusCode: number;
    message: string;
  }> {
    try {
      console.log(title, description, email, mobile, 'jjjj');
      // Use NotificationService to send email and SMS
      await this.propertyListService.sendEmailAndTextForLead(
        email,
        email_user,
        mobile,
        title,
        description,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Email and text message sent successfully',
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('address-search')
  async searchAddressesByAddress(
    @Query('address') address: string,
  ): Promise<{ statusCode: number; message: string; data: string[] }> {
    const addresses =
      await this.propertyListService.searchAddressesByAddress(address);

    return {
      statusCode: HttpStatus.OK,
      message: addresses.length ? 'Addresses found' : 'No addresses found',
      data: addresses,
    };
  }

  @Get('search-properties')
  @UseGuards(AuthGuard('jwt'))
  async searchProperties(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string,
  ): Promise<any> {
    try {
      const { properties, totalPages, totalProperties, currentPage } =
        await this.propertyListService.searchAllProperties(page, limit, search);

      return {
        statusCode: HttpStatus.OK,
        properties,
        totalPages,
        currentPage,
        totalProperties,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Put('start-biding/:id')
  @UseGuards(AuthGuard('jwt'))
  async startBiding(
    @Param('id') id: number,
    @Body() startBidingDto: StartBidingDto,
    @Body('ownerId') ownerId: number,
  ) {
    return this.propertyListService.startBiding(id, ownerId, startBidingDto);
  }
}
