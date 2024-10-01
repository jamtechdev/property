import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../../../models/user.model';
import {
  CreateUserDto,
  ViewPropertyUserDto,
  CreateBusinessCardDto,
} from '../../dto/user/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { Moderator } from '../../../models/moderator.model';
import PropertyList from 'models/propertylist.model';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Op, fn, col, where } from 'sequelize';
import ViewPropertyUser from 'models/viewpropertyusers.model';
import { BusinessCard } from 'models/business.card.model';
import CountyPayment from 'models/county.payment.model';
import County from 'models/admin/county.model';
import { Exclude } from 'class-transformer';
import BannerOptions from 'models/banner.options.model';

const { v4: uuidv4 } = require('uuid');

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @InjectModel(ViewPropertyUser)
    private readonly viewPropertyUsersModel: typeof ViewPropertyUser,
    @InjectModel(BusinessCard)
    private readonly businessCardModel: typeof BusinessCard,
    @InjectModel(CountyPayment)
    private readonly countyPaymentModel: typeof CountyPayment,
    @InjectModel(County)
    private readonly countyModel: typeof County,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; access_token: string }> {
    const { email, firstname, lastname, company_name } = createUserDto;
    const existingUser = await this.userModel.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email address is already in use');
    }

    let slug = 'user-profile';
    if (firstname || lastname || company_name) {
      slug = [firstname, lastname, company_name]
        .filter((name) => name)
        .map((name) => name.toLowerCase().replace(/\s+/g, '-'))
        .join('-');
    }

    // Construct the URL
    const uniqueId = uuidv4();
    const baseUrl = 'wholesale-real-estate-investor';
    const profileUrl = `${baseUrl}-${slug}-${uniqueId}`;
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      slug: profileUrl,
    });
    await user.save();

    const payload = { email: user.email, sub: user.id };
    await this.mailerService.sendMail({
      to: email,
      subject: 'Congratulations! on your registration',
      html: `<p>Hello,</p>
               <p>You are successfully registered in rehabloop.</p>
               <p>Your profile URL: <a href="rehabloop.com/wholesale-real-estate-investor/${slug}">rehabloop.com/wholesale-real-estate-investor/${slug}</a></p>
            `,
    });

    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: { email },
      include: [
        {
          model: BannerOptions,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: Moderator,
          include: [
            {
              model: CountyPayment,
              attributes: ['next_pay_date', 'county_pay'],
            },
            {
              model: County,
              attributes: ['countyName', 'county_fee'],
            },
          ],
        },
      ],
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      // Check if user is inactive
      if (user.is_active === false) {
        throw new UnauthorizedException(
          'Your account has been disabled. Please contact support.',
        );
      }
      await user.save();
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; access_token: string }> {
    const user = await this.validateUser(email, password);
    const payload = { email: user.email, sub: user.id };

    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async findById(id: number): Promise<User> {
    return this.userModel.findByPk(id);
  }

  async findByuserId(id: number): Promise<User> {
    return this.userModel.findByPk(id, { include: [Moderator, BannerOptions] });
  }

  async updateUser(id: number, updateUserDto: CreateUserDto): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user.update(updateUserDto);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async sendResetLink(email: string): Promise<void> {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Construct the reset link
    const resetLink = `${process.env.RAHABLOOP_DEV_URL}/reset-password`;

    // Send email with the reset link
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset',
      html: `<p>Hello,</p>
               <p>You have requested to reset your password. Please click the link below to reset your password:</p>
               <a href="${resetLink}">Reset Password</a>
               <p>If you did not request a password reset, you can ignore this email.</p>`,
    });
  }
  async findUserBySlug(
    slug: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<{
    user: User | null;
    properties: PropertyList[];
    pagination: {
      totalProperties: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const offset = (page - 1) * limit;
    const user = await this.userModel.findOne({
      where: { slug },
      include: [
        {
          model: BannerOptions,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    if (!user) {
      return {
        user: null,
        properties: [],
        pagination: {
          totalProperties: 0,
          totalPages: 0,
          currentPage: page,
        },
      };
    }
    const searchCondition = search
      ? { propertyName: { [Op.like]: `%${search}%` } }
      : {};
    const totalProperties = await PropertyList.count({
      where: {
        postedBy: user.id,
        ...searchCondition,
      },
    });
    const properties = await PropertyList.findAll({
      include: [
        { association: 'likedBy', attributes: ['userid'] },
        { association: 'savedPropertyBy', attributes: ['userid'] },
        {
          association: 'reviews',

          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          association: 'user',
          attributes: ['id', 'username', 'mobile', 'image'],
        },
      ],
      where: {
        postedBy: user.id,
        ...searchCondition,
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      limit: limit,
      offset: offset,
    });
    const totalPages = Math.ceil(totalProperties / limit);
    return {
      user,
      properties,
      pagination: {
        totalProperties,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findAllUser(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalUsers = await this.userModel.count();
    const totalPages = Math.ceil(totalUsers / parsedLimit);

    const users = await this.userModel.findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'password'],
      },
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + users.length;
    return {
      users,
      totalUsers,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async googleLoginOrSignup(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; access_token: string }> {
    const { email, firstname, lastname, password, image, company_name } =
      createUserDto;
    let user: User;
    const existingUser = await this.userModel.findOne({
      where: { email },
      include: Moderator,
    });

    if (
      existingUser &&
      (await bcrypt.compare(password, existingUser.password))
    ) {
      const payload = { email: existingUser.email, sub: existingUser.id };
      return {
        user: existingUser,
        access_token: this.jwtService.sign(payload),
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    let slug = 'user-profile';
    if (firstname || lastname || company_name) {
      slug = [firstname, lastname, company_name]
        .filter((name) => name)
        .map((name) => name.toLowerCase().replace(/\s+/g, '-'))
        .join('-');
    }
    const uniqueId = uuidv4();
    const baseUrl = 'wholesale-real-estate-investor';
    const profileUrl = `${baseUrl}-${slug}-${uniqueId}`;
    user = new this.userModel({
      username: firstname,
      firstname,
      lastname,
      email,
      image,
      password: hashedPassword,
      slug: profileUrl,
    });
    await user.save();
    const payload = { email: user.email, sub: user.id };
    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }
  async disableUser(userId: number): Promise<any> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.is_active == false) {
      user.is_active = true;
      await user.save();
      throw new HttpException(
        {
          status: HttpStatus.OK,
          message:
            'Your account has been re-enabled successfully. You can now log in.',
          user,
        },
        HttpStatus.OK,
      );
    }

    user.is_active = false;
    await user.save();

    throw new HttpException(
      {
        status: HttpStatus.OK,
        message: 'User disabled successfully',
        user,
      },
      HttpStatus.OK,
    );
  }

  async searchUsers(query: { searchValue?: string }): Promise<any> {
    const whereConditions: any = {};
    if (query.searchValue) {
      whereConditions[Op.or] = [
        { username: { [Op.like]: `%${query.searchValue}%` } },
        { email: { [Op.like]: `%${query.searchValue}%` } },
      ];
    }

    const users = await this.userModel.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
    });

    return {
      users: users,
    };
  }

  async createViewPropertyUsers(
    viewPropertyUserDto: ViewPropertyUserDto,
  ): Promise<ViewPropertyUser> {
    const viewPropertyUser = await this.viewPropertyUsersModel.findOne({
      where: {
        userId: viewPropertyUserDto.userId,
        propertyListId: viewPropertyUserDto.propertyListId,
      },
    } as any);
    if (viewPropertyUser)
      throw new HttpException(
        'viewPropertyUsers with same userId and propertyId already exists',
        HttpStatus.BAD_REQUEST,
      );
    return this.viewPropertyUsersModel.create(viewPropertyUserDto);
  }

  async findViewPropertyById(
    propertyListId: number,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const TotalViewProperty = await this.viewPropertyUsersModel.count({
      where: { propertyListId: propertyListId },
    });
    const totalPages = Math.ceil(TotalViewProperty / parsedLimit);
    const viewPropertyUsers = await this.viewPropertyUsersModel.findAll({
      where: { propertyListId: propertyListId },
      include: [
        {
          model: User,
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'password'],
          },
        },
        {
          model: PropertyList,
          attributes: ['propertyName', 'images'],
        },
      ],
      offset,
      limit: parsedLimit,
    });

    const from = offset + 1;
    const to = offset + viewPropertyUsers.length;

    return {
      viewPropertyUsers,
      TotalViewProperty,
      currentPage: parsedPage,
      totalPages,
      from,
      to,
    };
  }

  async createBusinessCard(createBusinessCardDto: CreateBusinessCardDto) {
    try {
      const userExists = await this.businessCardModel.findOne({
        where: { userId: createBusinessCardDto.userId },
      });
      if (userExists) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'A business card for this user already exists',
          error: 'Bad Request',
        });
      }

      const businessCard = await this.businessCardModel.create(
        createBusinessCardDto,
      );
      return {
        statusCode: 201,
        message: 'Business card created successfully',
        data: businessCard,
      };
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException({
          statusCode: 409,
          message: 'Email already exists',
          error: 'Conflict',
        });
      }
      throw error;
    }
  }

  async findOne(userId: number): Promise<BusinessCard[]> {
    return this.businessCardModel.findAll({ where: { userId: userId } });
  }

  async findAll(): Promise<BusinessCard[]> {
    return this.businessCardModel.findAll();
  }

  async updateBusinessCard(
    userId: number,
    updateBusinessCardDto: CreateBusinessCardDto,
  ): Promise<any> {
    const existingBusinessCard = await this.businessCardModel.findOne({
      where: { userId },
    });

    if (!existingBusinessCard) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Business card not found for the given userId',
        error: 'Not Found',
      });
    }
    if (
      updateBusinessCardDto.email &&
      updateBusinessCardDto.email !== existingBusinessCard.email
    ) {
      const emailConflict = await this.businessCardModel.findOne({
        where: { email: updateBusinessCardDto.email },
      });
      if (emailConflict) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Email already exists',
          error: 'Conflict',
        });
      }
    }
    await existingBusinessCard.update(updateBusinessCardDto);

    return {
      statusCode: 200,
      message: 'Business card updated successfully',
      data: existingBusinessCard,
    };
  }
}
