import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
  Param,
  NotFoundException,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { ValidationError } from 'sequelize';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import Benefit from 'models/admin/benefits.model';
import Country from 'models/admin/country.model';
import { County } from 'models/admin/county.model';
import State from 'models/admin/state.model';
import { City } from 'models/admin/city.model';

import { PaginationDto } from 'src/dto/pagination.dto';

import {
  CreateCountyDto,
  CreateStateDto,
  CreateBenefitDto,
  CreateCityDto,
  UpdateAdminDto,
} from 'src/dto/admin/admin.dto';
import { AdminService } from 'src/services/admin/admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    // private jwtService: JwtService
  ) {}

  @Post('login')
  async login(@Body() loginUserDto: { email: string; password: string }) {
    const { email, password } = loginUserDto;
    return this.adminService.login(email, password);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('get-countries')
  async findAll(@Query() paginationDto: PaginationDto): Promise<any> {
    const countries = await this.adminService.findAll(paginationDto);
    if (!countries) {
      throw new NotFoundException(`country not found`);
    }
    return {
      countries,
    };
  }

  // @UseGuards(AuthGuard('jwt'))
  @Post('add-country')
  async create(@Body() countryData: Partial<Country>): Promise<Country> {
    return this.adminService.create(countryData);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('get-states')
  async findAllState(@Query() paginationDto: PaginationDto): Promise<any> {
    const states = await this.adminService.findAllState(paginationDto);
    if (!states) {
      throw new NotFoundException(`state not found`);
    }
    return {
      states,
    };
  }

  @Get('get-states-name')
  async findAllStateName(): Promise<any> {
    const states = await this.adminService.findAllStateName();
    if (!states) {
      throw new NotFoundException(`state not found`);
    }
    return {
      states,
    };
  }

  // @UseGuards(AuthGuard('jwt'))
  @Post('add-states')
  async createState(@Body() createStateDto: CreateStateDto): Promise<State> {
    return this.adminService.createState(createStateDto);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('get-counties')
  async findAllCounty(@Query() paginationDto: PaginationDto): Promise<any> {
    const counties = await this.adminService.findAllCounty(paginationDto);
    if (!counties) {
      throw new NotFoundException(`counties not found`);
    }
    return {
      counties,
    };
  }

  @Get('get-counties-name')
  async findAllCountyName(): Promise<any> {
    const counties = await this.adminService.findAllCountyName();
    if (!counties) {
      throw new NotFoundException(`counties not found`);
    }
    return {
      counties,
    };
  }

  // @UseGuards(AuthGuard('jwt'))
  @Post('add-county')
  async createCounty(
    @Body() createCountyDto: CreateCountyDto,
  ): Promise<County> {
    return this.adminService.createCounty(createCountyDto);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('get-moderator')
  async findModerator(@Query() paginationDto: PaginationDto): Promise<any> {
    const moderators = await this.adminService.findModerator(paginationDto);
    return moderators;
  }

  // @UseGuards(AuthGuard('jwt'))
  @Post('add-benefit')
  async createBenefit(
    @Body() createbenefitDto: CreateBenefitDto,
  ): Promise<Benefit> {
    return this.adminService.createBenefit(createbenefitDto);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('get-benefits')
  async findAllBenefit(@Query() paginationDto: PaginationDto): Promise<any> {
    const benefits = await this.adminService.findAllBenefit(paginationDto);
    return benefits;
  }

  // @UseGuards(AuthGuard('jwt'))
  @Post('add-city')
  async createCity(@Body() createCityDto: CreateCityDto): Promise<City> {
    try {
      const result = await this.adminService.createCity(createCityDto);
      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Validation error',
            details: validationErrors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-city')
  @UseGuards(AuthGuard('jwt'))
  async findAllCity(@Query() paginationDto: PaginationDto): Promise<any> {
    const cities = await this.adminService.findAllCity(paginationDto);
    if (!cities) {
      throw new NotFoundException(`city not found`);
    }
    return {
      cities,
    };
  }
  // @UseGuards(AuthGuard('jwt'))
  @Get('inactive-moderator')
  async getInactiveModerator(
    @Query() paginationDto: PaginationDto,
  ): Promise<any> {
    const inactiveModerator =
      this.adminService.getModeratorInactive(paginationDto);
    return inactiveModerator;
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('notify-inactive-moderator/:id')
  async sendMailInactiveModerator(@Param('id') id: number): Promise<any> {
    return this.adminService.sendMailInactiveModerator(id);
  }

  @Get('deleted-moderators')
  // @UseGuards(AuthGuard('jwt'))
  async getDeletedModerator(
    @Query() paginationDto: PaginationDto,
  ): Promise<any> {
    const result =
      await this.adminService.findAllDeletedModerators(paginationDto);
    if (!result || result.length === 0) {
      throw new NotFoundException(`No deleted moderators found`);
    }

    return result;
  }

  @Get('state/search')
  async searchStates(@Query('stateName') stateName: string): Promise<any> {
    return await this.adminService.searchStates(stateName);
  }
  @Get('city/search')
  async searchCities(@Query('city') city: string): Promise<any> {
    return await this.adminService.searchCities(city);
  }

  @Get('country/search')
  async searchCountries(@Query('name') name: string): Promise<any> {
    return await this.adminService.searchCountries(name);
  }
  @Get('county/search')
  async searchCounties(@Query('countyName') countyName: string): Promise<any> {
    return await this.adminService.searchCounties(countyName);
  }

  @Get('moderators/search')
  async searchModerators(@Query('searchValue') searchValue: string) {
    const result = await this.adminService.searchModerators({ searchValue });
    return result;
  }

  @Delete('delete-state/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteStateById(@Param('id', ParseIntPipe) id: number) {
    const deleteState = await this.adminService.deleteStateById(id);
    return deleteState;
  }

  @Delete('delete-city/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCityById(@Param('id', ParseIntPipe) id: number) {
    const deleteCity = await this.adminService.deleteCityById(id);
    return deleteCity;
  }
  @Delete('delete-county/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCountyById(@Param('id', ParseIntPipe) id: number) {
    const deleteCounty = await this.adminService.deleteCountyById(id);
    return deleteCounty;
  }
  @Delete('delete-country/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCountryById(@Param('id', ParseIntPipe) id: number) {
    const deleteCountry = await this.adminService.deleteCountryById(id);
    return deleteCountry;
  }

  @Put('update-admin/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateAdmin(
    @Param('id') id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.updateAdmin(id, { ...updateAdminDto });
  }
}
