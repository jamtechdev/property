// src/services/admin/admin.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import Admin from 'models/admin/admin.model';
import Country from 'models/admin/country.model';
import States from 'models/admin/state.model';
import {
  CreateBenefitDto,
  CreateCountyDto,
  CreateStateDto,
  CreateCityDto,
  UpdateAdminDto,
} from 'src/dto/admin/admin.dto';
import { County } from 'models/admin/county.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import Moderator from 'models/moderator.model';
import Benefit from 'models/admin/benefits.model';
import User from 'models/user.model';
import City from 'models/admin/city.model';
import { Op, fn, col, where } from 'sequelize';
import { MailerService } from '@nestjs-modules/mailer';
import { startOfYesterday } from 'date-fns';

import { TwilioService } from 'src/twilio/twilio.service';
import { stat } from 'fs/promises';
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin)
    private adminModel: typeof Admin,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @InjectModel(Country)
    private countryModel: typeof Country,
    @InjectModel(States) private stateModel: typeof States,
    @InjectModel(County) private countyModel: typeof County,
    @InjectModel(Benefit) private benefitModel: typeof Benefit,
    @InjectModel(City) private cityModel: typeof City,
    @InjectModel(Moderator) private moderatorModel: typeof Moderator,
    private readonly twilioService: TwilioService,
  ) {}

  async findById(id: number): Promise<Admin> {
    return this.adminModel.findByPk(id);
  }

  async findByEmail(email: string): Promise<Admin> {
    return this.adminModel.findOne({ where: { email } });
  }

  async validateAdmin(email: string, password: string): Promise<Admin> {
    const admin = await this.findByEmail(email);
    if (admin && (await bcrypt.compare(password, admin.password))) {
      return admin;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ admin: Admin; access_token: string }> {
    const admin = await this.validateAdmin(email, password);
    const payload = { email: admin.email, sub: admin.id, role: 'admin' };
    return {
      admin,
      access_token: this.jwtService.sign(payload),
    };
  }

  async signUp(email: string, password: string): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.adminModel.create({
      email,
      password: hashedPassword,
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalCountry = await this.countryModel.count();
    const totalPages = Math.ceil(totalCountry / parsedLimit);

    const countries = await this.countryModel.findAll({
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + countries.length;
    return {
      countries,
      totalCountry,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async create(countryData: Partial<Country>): Promise<Country> {
    return this.countryModel.create(countryData);
  }

  async findAllState(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const allStates = await this.stateModel.findAll({
      include: [
        {
          model: Country,
          attributes: ['name'],
        },
      ],
      attributes: { exclude: ['zips'] },
    });
    const uniqueStates = allStates.filter(
      (state, index, self) =>
        index === self.findIndex((s) => s.stateName === state.stateName),
    );
    const totalStates = uniqueStates.length;
    const paginatedStates = uniqueStates.slice(offset, offset + parsedLimit);
    const totalPages = Math.ceil(totalStates / parsedLimit);
    const from = offset + 1;
    const to = offset + paginatedStates.length;

    return {
      states: paginatedStates,
      totalStates,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async findAllStateName(): Promise<any> {
    // Fetch all states including the associated country name
    const uniqueStates = await this.stateModel.findAll({
      include: [
        {
          model: Country,
          attributes: ['name'],
        },
      ],
    });

    // Use a Set to remove duplicates based on state name
    const states = uniqueStates.filter(
      (uniqueStates, index, self) =>
        index === self.findIndex((s) => s.stateName === uniqueStates.stateName),
    );

    return {
      states: states,
    };
  }

  async createState(createStateDto: CreateStateDto): Promise<States> {
    return this.stateModel.create(createStateDto);
  }

  async findAllCounty(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalCounty = await this.countyModel.count();
    const totalPages = Math.ceil(totalCounty / parsedLimit);

    const counties = await this.countyModel.findAll({
      include: [
        {
          model: Country,
          attributes: ['name'], // Specify attributes to include from 'user' association
        },
        {
          model: States,
          attributes: ['statename'],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + counties.length;
    return {
      counties,
      totalCounty,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async findAllCountyName(): Promise<any> {
    const counties = await this.countyModel.findAll({
      include: [
        {
          model: Country,
          attributes: ['name'],
        },
        {
          model: States,
          attributes: ['statename'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return {
      counties,
    };
  }

  async createCounty(createCountyDto: CreateCountyDto): Promise<County> {
    return this.countyModel.create(createCountyDto);
  }

  async findModerator(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalModerator = await this.moderatorModel.count();
    const totalPages = Math.ceil(totalModerator / parsedLimit);

    const moderators = await Moderator.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
        { model: County, attributes: ['countyName'] },
      ],

      order: [['createdAt', 'DESC']],
      offset,
      limit: parsedLimit,
    });
    const from = offset + 1;
    const to = offset + moderators.length;
    return {
      moderators,
      totalModerator,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async createBenefit(createbenefitDto: CreateBenefitDto): Promise<Benefit> {
    return this.benefitModel.create(createbenefitDto);
  }

  async findAllBenefit(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalBenefit = await this.benefitModel.count();
    const totalPages = Math.ceil(totalBenefit / parsedLimit);

    const benefits = await this.benefitModel.findAll({
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + benefits.length;
    return {
      benefits,
      totalBenefit,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async createCity(createcityDto: CreateCityDto): Promise<City> {
    return this.cityModel.create(createcityDto);
  }

  async findAllCity(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalCity = await this.cityModel.count();
    const totalPages = Math.ceil(totalCity / parsedLimit);

    const cities = await this.cityModel.findAll({
      include: [
        {
          model: Country,
          attributes: ['name'],
        },
        {
          model: States,
          attributes: ['statename'],
        },
      ],
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + cities.length;
    return {
      cities,
      totalCity,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }
  async getModeratorInactive(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    const moderators = await this.moderatorModel.findAll({
      where: {
        // status: 'pending',
        is_active_status: false,
        is_deleted: false,
      },
      include: [
        {
          model: User,
        },
        { model: County, attributes: ['countyName'] },
      ],
      offset,
      limit: parsedLimit,
    });
    const from = offset + 1;
    const to = offset + moderators.length;
    const totalInactiveModerator = moderators.length;
    const totalPages = Math.ceil(totalInactiveModerator / parsedLimit);
    return {
      moderators,
      totalInactiveModerator,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async sendMailInactiveModerator(id: number): Promise<any> {
    const moderator = await Moderator.findOne({
      where: { userId: id },
      include: User,
    });

    try {
      const text = `Dear Moderator,\n\nYour account is currently inactive. Please contact support to reactivate your account.\n\nBest regards,\nAdmin Team.`;
      await this.mailerService.sendMail({
        to: moderator.email,
        subject: 'Your account is inactive',
        html: text,
      });

      const mobile = moderator.user.mobile;
      await this.twilioService.sendSms(text, mobile);
      return { message: 'Email sent successfully', moderator };
    } catch (emailError) {
      return { message: 'Failed to send email', error: emailError.message };
    }
  }

  async findAllDeletedModerators(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    const deletedModerators = await this.moderatorModel.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
      ],
      where: {
        is_deleted: true,
      },
      offset,
      limit: parsedLimit,
    });

    if (!deletedModerators || deletedModerators.length === 0) {
      throw new NotFoundException(`No deleted moderators found`);
    }
    const from = offset + 1;
    const to = offset + deletedModerators.length;
    const totalDeleteModerator = deletedModerators.length;
    const totalPages = Math.ceil(totalDeleteModerator / parsedLimit);
    return {
      message: 'Successfully found all deleted moderators',
      statusCode: HttpStatus.OK,
      deletedModerators: deletedModerators,
      totalDeleteModerator,
      totalPages,
      currentPage: parsedPage,
      from,
      to,
    };
  }

  async searchStates(stateName: string): Promise<any> {
    const uniqueStates = await this.stateModel.findAll({
      where: {
        stateName: {
          [Op.like]: `%${stateName}%`,
        },
      },
    });

    // Use a Set to remove duplicates based on state name
    const state = uniqueStates.filter(
      (uniqueStates, index, self) =>
        index === self.findIndex((s) => s.stateName === uniqueStates.stateName),
    );
    return {
      state: state,
    };
  }

  async searchCities(cityName: string): Promise<any> {
    const cities = await this.cityModel.findAll({
      where: {
        city: {
          [Op.like]: `%${cityName}%`,
        },
      },
      include: [
        {
          model: Country,
          attributes: ['name'],
        },
        {
          model: this.stateModel,
          attributes: ['statename'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      cities: cities,
    };
  }
  async searchCountries(name: string): Promise<any> {
    const countries = await this.countryModel.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`,
        },
      },
      order: [['createdAt', 'DESC']],
    });

    return {
      countries: countries,
    };
  }
  async searchCounties(countyName: string): Promise<any> {
    const counties = await this.countyModel.findAll({
      where: {
        countyName: {
          [Op.like]: `%${countyName}%`,
        },
      },
      include: [
        {
          model: Country,
          attributes: ['name'],
        },
        {
          model: this.stateModel,
          attributes: ['statename'],
        },
      ],
      order: [['createdAt', 'DESC']], // Optional: Order by creation date
    });

    return {
      counties: counties,
    };
  }

  async searchModerators(query: { searchValue?: string }): Promise<any> {
    const whereConditions: any = {};
    if (query.searchValue) {
      whereConditions[Op.or] = [
        { '$user.username$': { [Op.like]: `%${query.searchValue}%` } },
        { email: { [Op.like]: `%${query.searchValue}%` } },
      ];
    }

    const moderators = await this.moderatorModel.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      moderators: moderators,
    };
  }

  async deleteStateById(id: number): Promise<{ message: string }> {
    const result = await this.stateModel.destroy({ where: { id } });
    if (result) {
      return { message: 'State removed successfully.' };
    } else {
      return { message: 'State not found.' };
    }
  }

  async deleteCityById(id: number): Promise<{ message: string }> {
    const result = await this.cityModel.destroy({ where: { id } });
    if (result) {
      return { message: 'City removed successfully.' };
    } else {
      return { message: 'City not found.' };
    }
  }

  async deleteCountyById(id: number): Promise<{ message: string }> {
    const result = await this.countyModel.destroy({ where: { id } });
    if (result) {
      return { message: 'County removed successfully.' };
    } else {
      return { message: 'County not found.' };
    }
  }

  async deleteCountryById(id: number): Promise<{ message: string }> {
    const result = await this.countryModel.destroy({ where: { id } });
    if (result) {
      return { message: 'Country removed successfully.' };
    } else {
      return { message: 'Country not found.' };
    }
  }

  async updateAdmin(
    id: number,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    const admin = await Admin.findByPk(id);

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Update fields if provided
    if (updateAdminDto.email !== undefined) {
      admin.email = updateAdminDto.email;
    }
    if (updateAdminDto.password !== undefined) {
      const hashedPassword = await bcrypt.hash(updateAdminDto.password, 10);
      admin.password = hashedPassword;
    }
    if (updateAdminDto.image !== undefined) {
      admin.image = updateAdminDto.image;
    }

    await admin.save();
    return admin;
  }
}
