import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
  Patch,
  Post,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import BusinessCard from 'models/business.card.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import {
  CreateUserDto,
  ViewPropertyUserDto,
  CreateBusinessCardDto,
} from 'src/dto/user/create-user.dto';
import { UserService } from 'src/services/user/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('jwt')) // Protect the endpoint with JWT authentication
  @Put('update-user/:id')
  async updateUser(
    @Param('id') userId: number,
    @Body() updateUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    try {
      await this.userService.updateUser(userId, updateUserDto);
      return { message: 'User updated successfully' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt')) // Protect the endpoint with JWT authentication
  @Get('get-profile')
  async getUserProfile(@Req() request): Promise<CreateUserDto> {
    try {
      const userId = request.user.id; // Assuming 'id' is the property containing the user ID in the token
      const user = await this.userService.findByuserId(userId); // Fetch user data from the database
      return user; // Return the user data
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('get-profile-by-slug/:slug')
  @HttpCode(HttpStatus.OK)
  async getUserProfileBySlug(
    @Param('slug') slug: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
  ): Promise<any> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    try {
      const user = await this.userService.findUserBySlug(
        slug,
        pageNumber,
        limitNumber,
        search,
      );

      if (!user.user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found!',
          data: null,
        };
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'User data retrieved successfully',
        data: user,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('all-users')
  // @UseGuards(AuthGuard('jwt'))
  async findUsers(@Query() paginationDto: PaginationDto): Promise<any> {
    const allUsers = await this.userService.findAllUser(paginationDto);
    if (!allUsers) {
      throw new NotFoundException(`users not found`);
    }
    return allUsers;
  }

  @Patch('disable/:id')
  async disableUser(@Param('id') id: number) {
    const result = await this.userService.disableUser(id);
    return result;
  }

  @Get('search')
  async searchUsers(@Query('searchValue') searchValue: string) {
    const result = await this.userService.searchUsers({ searchValue });
    return result;
  }

  @Post('create-view-property-user')
  @UseGuards(AuthGuard('jwt'))
  async createViewPropertyUser(
    @Body() viewPropertyUserDto: ViewPropertyUserDto,
  ) {
    return this.userService.createViewPropertyUsers(viewPropertyUserDto);
  }

  @Get('view-property-user')
  @UseGuards(AuthGuard('jwt'))
  async getViewPropertyUserById(
    @Query('propertyListId') propertyListId: number,
    @Query() paginationDto: PaginationDto,
    @Req() req: Request,
  ): Promise<any> {
    const viewPropertyUser = await this.userService.findViewPropertyById(
      propertyListId,
      paginationDto,
    );
    if (!viewPropertyUser) {
      throw new NotFoundException(
        `view property users not found ${propertyListId}`,
      );
    }
    return viewPropertyUser;
  }
  @Post('add-business-card-details')
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() createBusinessCardDto: CreateBusinessCardDto,
  ): Promise<any> {
    return this.userService.createBusinessCard(createBusinessCardDto);
  }

  @Get('get-business-card-details/:userId')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('userId') userId: number,
  ): Promise<{ statusCode: number; message: string; data: BusinessCard[] }> {
    const data = await this.userService.findOne(userId);
    if (!data || data.length === 0) {
      return {
        statusCode: 200,
        message: `No business card found for user ID ${userId}`,
        data: [],
      };
    }

    if (!data) {
      return {
        statusCode: 404,
        message: 'Business card not found',
        data: null,
      };
    }
    return {
      statusCode: 200,
      message: 'Business card retrieved successfully',
      data,
    };
  }

  @Get('get-all-business-card-details')
  // @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<{
    statusCode: number;
    message: string;
    data: BusinessCard[];
  }> {
    const data = await this.userService.findAll();
    return {
      statusCode: 200,
      message: 'Business cards retrieved successfully',
      data,
    };
  }

  @Put('update-business-card-details/:userId')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('userId') userId: number,
    @Body() updateBusinessCardDto: CreateBusinessCardDto,
  ): Promise<any> {
    return this.userService.updateBusinessCard(userId, updateBusinessCardDto);
  }
}
