/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  HttpStatus,
  HttpException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PropertyList } from '../../../../models/propertylist.model';

import {
  CreateLeadDto,
  CreatePropertyListDto,
  StartBidingDto,
} from '../../../dto/propertyListing/property-listing/property-listing.dto';
import { User } from 'models/user.model';
import { Op, literal } from 'sequelize';
import Moderator from 'models/moderator.model';
import { MailerService } from '@nestjs-modules/mailer';
import { addDays, differenceInDays } from 'date-fns';
import { SaveProperty } from 'models/saveproperty.model';
import { subDays } from 'date-fns';
import { FavoriteProperty } from 'models/favoriteproperty.model';
import AutoPublishedProperty from 'models/autopublished.property.model';
import * as moment from 'moment-timezone';
import * as cron from 'node-cron';
import { PaginationDto } from 'src/dto/pagination.dto';
import { TwilioService } from 'src/twilio/twilio.service';
import moderatorRating from 'models/moderator.rating.model';
import Lead from 'models/leads.model';
@Injectable()
export class PropertyListService {
  constructor(
    @InjectModel(PropertyList)
    private propertyListModel: typeof PropertyList,
    @InjectModel(SaveProperty)
    private savePropertyModel: typeof SaveProperty,
    @InjectModel(FavoriteProperty)
    private favoritePropertyModel: typeof FavoriteProperty,
    @InjectModel(AutoPublishedProperty)
    private autoPublishedPropertyModel: typeof AutoPublishedProperty,
    private readonly mailerService: MailerService,
    private readonly twilioService: TwilioService,
  ) {}

  async create(createPropertyListDto: CreatePropertyListDto): Promise<any> {
    try {
      const propertyList = new PropertyList(createPropertyListDto);
      await propertyList.save();
      const user = await User.findByPk(propertyList.postedBy);

      if (user.mobile) {
        const text = `Thank you for registering your property with us, ${user.firstname}! Your property name "${propertyList.propertyName}" has been successfully added.`;
        const mobile = user.mobile;
        await this.twilioService.sendSms(text, mobile);
      }
      const savedProperties = await this.savePropertyModel.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [
          {
            model: PropertyList,
            attributes: ['countyId'],

            where: {
              countyId: propertyList.countyId,
            },
          },
          { model: User, attributes: ['email'] },
        ],
      });

      const uniqueEmails = new Set();
      const uniqueProperties = savedProperties.filter((property) => {
        if (property.user && !uniqueEmails.has(property.user.email)) {
          uniqueEmails.add(property.user.email);
          return true;
        }
        return false;
      });

      let userEmails = uniqueProperties.map((user) => {
        return user.user.email;
      });

      //Find moderators by countyId and status approved
      let moderators: any = await Moderator.findAll({
        where: {
          county: createPropertyListDto.countyId,
          status: 'approved',
          is_deleted: false,
        },
        include: User,
      });

      const emailPromises = [
        ...moderators.map((moderator) => {
          const text = `Dear ${moderator.user.username}, a new property "${propertyList.propertyName}" has been registered in your county by ${user.firstname}. Please review it at your earliest convenience.`;
          const mobile = moderator.user.mobile;

          this.twilioService.sendSms(text, mobile);
          return this.mailerService
            .sendMail({
              to: moderator.email,
              subject: 'New Property Listing',
              template: 'new_property_listing',
              context: {
                moderator,
                propertyList,
              },
            })
            .catch((emailError) => {
              console.error(
                `Error sending email to ${moderator.email}:`,
                emailError,
              );
            });
        }),
        ...userEmails.map((email) => {
          if (userEmails.includes(email)) {
            return this.mailerService
              .sendMail({
                to: email,
                subject: 'New Property Listing',
                template: 'new_property_listing',
                context: {
                  email,
                  propertyList,
                },
              })
              .catch((emailError) => {
                console.error(`Error sending email to ${email}:`, emailError);
              });
          }
        }),
      ];
      try {
        await Promise.all(emailPromises);
        console.log('All emails sent successfully.');
      } catch (sendAllError) {
        console.error('Error sending emails:', sendAllError);
      }
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Property added successfully',
        property: propertyList,
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

  async getPropertyList(
    page: number,
    limit: number,
    price_min: number,
    price_max: number,
    type: string,
    propertyId: string,
    bedrooms: number,
    bathrooms: number,
    location: string,
    square_min: number,
    square_max: number,
    listed_in: string,
    sortBy: string,
    other_features: string,
    state: number,
    county: number,
    userId: number,
  ): Promise<{
    properties: any[];
    totalPages: number;
    currentPage: number;
    totalProperties: number;
  }> {
    const pages = Number(page);
    const numericLimit = Number(limit);
    const offset = (pages - 1) * numericLimit;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sevenDaysAgo = subDays(new Date(), 7);

    const whereClause: any = {
      status: 'Publish',
      posted_on: { [Op.gte]: thirtyDaysAgo },
      is_deleted_property: false,
      property_Status: 'Active',
    };

    if (price_min != null && price_max != null) {
      whereClause[Op.and] = literal(
        `(CAST(price_in AS DECIMAL) BETWEEN ${Number(price_min)} AND ${Number(price_max)})`,
      );
    }
    if (type) {
      whereClause.select_Category = type;
    }
    if (propertyId) {
      whereClause.custom_id = propertyId;
    }
    if (bedrooms) {
      whereClause.bedrooms = bedrooms;
    }
    if (bathrooms) {
      whereClause.bathrooms = bathrooms;
    }
    if (location) {
      whereClause.city = location;
    }
    if (square_min && square_max) {
      whereClause.size_in_ft = { [Op.between]: [square_min, square_max] };
    }
    if (listed_in) {
      whereClause.listed_in = listed_in;
    }
    if (state) {
      whereClause.stateId = state;
    }
    if (other_features) {
      const featuresArray = other_features
        .split(',')
        .map((feature) => feature.trim());
      whereClause.other_features = {
        [Op.and]: featuresArray.map((feature) => ({
          [Op.like]: `%${feature}%`,
        })),
      };
    }
    const orderBy: any[] = [];
    switch (sortBy) {
      case 'price_low':
        orderBy.push(['price_in', 'ASC']);
        break;
      case 'price_high':
        orderBy.push(['price_in', 'DESC']);
        break;
      case 'newest':
        orderBy.push(['posted_on', 'DESC']);
        break;
      case 'best_seller':
        orderBy.push(['sales', 'DESC']);
        break;
      default:
        orderBy.push(['updatedAt', 'DESC']);
        break;
    }
    const totalProperties = await PropertyList.count({
      where: whereClause,
    });
    const totalPages = Math.ceil(totalProperties / numericLimit);
    try {
      const properties = await PropertyList.findAll({
        include: [
          { association: 'likedBy', attributes: ['userid'] },
          { association: 'savedPropertyBy', attributes: ['userid'] },
          {
            association: 'reviews',

            attributes: { exclude: ['createdAt', 'updatedAt'] },
            where: {
              [Op.or]: [
                { is_approved: true },
                ...(userId ? [{ userId: userId }] : []),
              ],
            },
            required: false,
          },
          {
            association: 'user',
            attributes: ['id', 'username', 'mobile', 'image'],
          },
          { association: 'county', attributes: ['id', 'countyName'] },
          { association: 'state', attributes: ['id', 'stateName'] },
          { association: 'country', attributes: ['id', 'name'] },
          {
            association: 'moderator',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
        attributes: { exclude: ['userId', 'countryId'] },
        where: {
          [Op.and]: [whereClause],
        },

        order: [
          [
            literal(
              `CASE WHEN featured_property = true AND featuredAt >= '${sevenDaysAgo.toISOString()}' THEN 1 ELSE 0 END`,
            ),
            'DESC',
          ],
          ...orderBy,
        ],
        offset: offset,
        limit: numericLimit,
      });

      // Calculate remaining days for featured properties
      const propertiesWithRemainingDays = await Promise.all(
        properties.map(async (property) => {
          const isFeatured = property.featured_property;
          let upgradeRemainingDays = null;
          if (isFeatured) {
            const featuredAt = new Date(property.featuredAt);
            const diffTime = Math.abs(
              new Date().getTime() - featuredAt.getTime(),
            );
            upgradeRemainingDays =
              7 - Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (upgradeRemainingDays <= 0) {
              await property.update(
                { featured_property: false },
                {
                  silent: true,
                },
              );
              upgradeRemainingDays = 0;
            }
          }
          return {
            ...property.toJSON(),
            upgradeRemainingDays,
          };
        }),
      );

      return {
        properties: propertiesWithRemainingDays,
        totalPages,
        currentPage: pages,
        totalProperties: totalProperties,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPropertyListByLocation(
    page: number = 1,
    limit: number = 10,
    search: string,
  ): Promise<{
    properties: PropertyList[];
    totalPages: number;
    totalProperties: number;
    currentPage: number;
  }> {
    limit = Number(limit) || 10;
    const offset = (page - 1) * limit;

    // Prepare the search query
    const inputWords =
      search
        ?.toLowerCase()
        .split(/[\s]+/)
        .filter((word) => word.trim()) || [];

    // Fetch properties and apply filtering
    const { count: totalProperties, rows: properties } =
      await this.propertyListModel.findAndCountAll({
        include: [
          {
            association: 'user',
            attributes: ['id', 'username'],
          },
          {
            association: 'county',
            attributes: ['id', 'countyName'],
          },
          {
            association: 'state',
            attributes: ['id', 'stateName'],
          },
          {
            association: 'country',
            attributes: ['id', 'name'],
          },
        ],
        attributes: {
          exclude: ['userId', 'countyId', 'stateId', 'countryId'],
        },
        where: {
          status: 'Publish',
          [Op.or]: inputWords.map((word) => ({
            [Op.or]: [
              { zip: { [Op.like]: `%${word}%` } },
              { city: { [Op.like]: `%${word}%` } },
              { '$county.countyName$': { [Op.like]: `%${word}%` } },
              { '$state.stateName$': { [Op.like]: `%${word}%` } },
            ],
          })),
        },
        offset,
        limit,
      });

    const totalPages = Math.ceil(totalProperties / limit);
    const currentPage = page;

    return { properties, totalPages, totalProperties, currentPage };
  }

  sendMailToUser = async (email: any, text: any, subject: any) => {
    await this.mailerService.sendMail({
      to: email,
      subject: subject,
      html: `<p>Hello,</p>
               <p>  ${text} </p>`,
    });
  };

  async update(
    id: number,
    updatePropertyListDto: CreatePropertyListDto,
  ): Promise<PropertyList> {
    const propertyList = await this.propertyListModel.findByPk(id, {
      include: [{ model: User }],
    });
    if (!propertyList) {
      throw new Error('Property not found');
    }
    if (updatePropertyListDto.status === 'Hold') {
      let body =
        'Moderator puts your property on hold till' +
        ' ' +
        updatePropertyListDto?.hold_duration;
      let subject = 'Property puts on hold';
      this.sendMailToUser(propertyList?.user?.email, body, subject);
      const text = body;
      const mobile = propertyList.user.mobile;
      await this.twilioService.sendSms(text, mobile);
    }
    if (updatePropertyListDto.status === 'Decline') {
      let body = 'Moderator declined your listed property';
      let subject = 'Property declined';
      this.sendMailToUser(propertyList?.user?.email, body, subject);
      const text = body;
      const mobile = propertyList.user.mobile;
      await this.twilioService.sendSms(text, mobile);
    }
    if (updatePropertyListDto.status === 'Publish') {
      let body = 'Your property has been published successfully';
      let subject = 'Property published';
      this.sendMailToUser(propertyList?.user?.email, body, subject);
      const text = body;
      const mobile = propertyList.user.mobile;
      await this.twilioService.sendSms(text, mobile);
    }
    if (updatePropertyListDto.status === 'Contract') {
      let body = 'Your property has been contracted successfully.';
      let subject = 'Property Contract';
      this.sendMailToUser(propertyList?.user?.email, body, subject);
      const text = body;
      const mobile = propertyList.user.mobile;
      await this.twilioService.sendSms(text, mobile);
    }
    if (updatePropertyListDto.status === 'Do_not_list') {
      let body = `Your property ${propertyList.propertyName} has been set to "Do Not List".`;
      let subject = 'Property Do_not_listed';
      this.sendMailToUser(propertyList?.user?.email, body, subject);
      const text = body;
      const mobile = propertyList.user.mobile;
      await this.twilioService.sendSms(text, mobile);
    }
    await propertyList.update(updatePropertyListDto);
    if (propertyList.status === 'Do_not_list') {
      const moderator = await Moderator.findOne({
        where: { county: propertyList.countyId },
        include: User,
      });
      let body = `Dear Moderator ,Your property ${propertyList.propertyName} has been set to "Do Not List".`;
      let subject = 'Property Do_not_listed';
      this.sendMailToUser(moderator.email, body, subject);
      const text = body;
      const mobile = moderator.user.mobile;
      await this.twilioService.sendSms(text, mobile);
    }
    return propertyList.reload();
  }

  async findPropertiesNearby(
    page: number,
    pageSize: number,
    price_min: number,
    price_max: number,
    type: string,
    propertyId: string,
    bedrooms: number,
    bathrooms: number,
    location: string,
    square_min: number,
    square_max: number,
    listed_in: string,
    sortBy: string,
    other_features: string,
    state: number,
    county: number,
    userId: number,
    latitude?: number,
    longitude?: number,
  ): Promise<{
    properties: any[];
    totalPages: number;
    currentPage: number;
    totalProperties: number;
  }> {
    const pages = Number(page);
    const numericLimit = Number(pageSize);
    const offset = (pages - 1) * numericLimit;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sevenDaysAgo = subDays(new Date(), 7);
    const whereClause: any = {
      status: 'Publish',
      posted_on: { [Op.gte]: thirtyDaysAgo },
      is_deleted_property: false,
      property_Status: 'Active',
    };

    if (price_min != null && price_max != null) {
      whereClause[Op.and] = literal(
        `(CAST(price_in AS DECIMAL) BETWEEN ${Number(price_min)} AND ${Number(price_max)})`,
      );
    }
    if (type) {
      whereClause.select_Category = type;
    }
    if (propertyId) {
      whereClause.custom_id = propertyId;
    }
    if (bedrooms) {
      whereClause.bedrooms = bedrooms;
    }
    if (bathrooms) {
      whereClause.bathrooms = bathrooms;
    }
    if (location) {
      whereClause.city = location;
    }
    if (square_min && square_max) {
      whereClause.size_in_ft = { [Op.between]: [square_min, square_max] };
    }
    if (listed_in) {
      whereClause.listed_in = listed_in;
    }
    if (state) {
      whereClause.stateId = state;
    }
    if (other_features) {
      const featuresArray = other_features
        .split(',')
        .map((feature) => feature.trim());
      whereClause.other_features = {
        [Op.and]: featuresArray.map((feature) => ({
          [Op.like]: `%${feature}%`,
        })),
      };
    }

    const orderBy: any[] = [];

    switch (sortBy) {
      case 'price_low':
        orderBy.push(['price_in', 'ASC']);
        break;
      case 'price_high':
        orderBy.push(['price_in', 'DESC']);
        break;
      case 'newest':
        orderBy.push(['posted_on', 'DESC']);
        break;
      case 'best_seller':
        orderBy.push(['sales', 'DESC']);
        break;
      default:
        orderBy.push(['updatedAt', 'DESC']);
        break;
    }

    const distanceCondition =
      latitude && longitude
        ? literal(
            `(${6371} * acos(cos(radians(${latitude})) * cos(radians(PropertyList.latitude)) * cos(radians(PropertyList.longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(PropertyList.latitude)))) <= 60`,
          )
        : undefined;

    if (distanceCondition) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push(distanceCondition);
    }

    try {
      // Fetch total count of properties
      const totalProperties = await PropertyList.count({
        where: {
          [Op.and]: [whereClause],
        },
      });

      // Fetch paginated properties
      const properties = await PropertyList.findAll({
        attributes: {
          include:
            latitude && longitude
              ? [
                  [
                    literal(
                      `(${6371} * acos(cos(radians(${latitude})) * cos(radians(PropertyList.latitude)) * cos(radians(PropertyList.longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(PropertyList.latitude))))`,
                    ),
                    'distance',
                  ],
                ]
              : [],
        },
        where: {
          [Op.and]: [whereClause],
        },
        include: [
          { association: 'likedBy', attributes: ['userid'] },
          { association: 'savedPropertyBy', attributes: ['userid'] },
          {
            association: 'reviews',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            where: {
              [Op.or]: [
                { is_approved: true },
                ...(userId ? [{ userId: userId }] : []),
              ],
            },
            required: false,
          },
          {
            association: 'user',
            attributes: ['id', 'username', 'mobile', 'image'],
          },
          { association: 'county', attributes: ['id', 'countyName'] },
          { association: 'state', attributes: ['id', 'stateName'] },
          { association: 'country', attributes: ['id', 'name'] },
          {
            association: 'moderator',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
        order: orderBy,
        offset,
        limit: numericLimit,
      });

      const propertiesWithRemainingDays = await Promise.all(
        properties.map(async (property) => {
          const isFeatured = property.featured_property;
          let upgradeRemainingDays = null;
          if (isFeatured) {
            const featuredAt = new Date(property.featuredAt);
            const diffTime = Math.abs(
              new Date().getTime() - featuredAt.getTime(),
            );
            upgradeRemainingDays =
              7 - Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (upgradeRemainingDays <= 0) {
              await property.update(
                { featured_property: false },
                {
                  silent: true,
                },
              );
              upgradeRemainingDays = 0;
            }
          }
          return {
            ...property.toJSON(),
            upgradeRemainingDays,
          };
        }),
      );

      const totalPages = Math.ceil(totalProperties / numericLimit);
      return {
        properties: propertiesWithRemainingDays,
        totalPages,
        currentPage: pages,
        totalProperties,
      };
    } catch (error) {
      throw error;
    }
  }

  async autoPublish(): Promise<any> {
    try {
      const propertyIdsToUpdate = await this.propertyListModel.findAll({
        where: {
          status: 'Posted',
          createdAt: {
            [Op.lte]: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (propertyIdsToUpdate && propertyIdsToUpdate.length > 0) {
        const ids = propertyIdsToUpdate.map((property: any) => ({
          id: property.id,
          countyId: property.countyId,
          createdAt: property.createdAt,
          status: property.status,
        }));
        const moderatorsToUpdate: Set<number> = new Set();
        const updatePromises = ids.map(async ({ id, countyId, status }) => {
          try {
            const moderators = await Moderator.findAll({
              where: { county: countyId },
              include: User,
            });
            const moderatorPromises = moderators.map(async (moderator) => {
              try {
                await this.autoPublishedPropertyModel.create({
                  propertyId: id,
                  moderatorId: moderator.id,
                  auto_published_charge: '25',
                  property_pre_status: status,
                });
                const text = `Dear moderator,\n\nThis is a notification regarding properties that have been automatically published in your moderated county. As per our policies, it is mandatory to review and moderate all property listings within the stipulated time frame.\n\nFailure to do so may result in losing your moderator membership.\n\nPlease ensure that you moderate all listings promptly to avoid any disciplinary actions.\n\nThank you for your cooperation.\n\nBest regards,\n[Your Company Name]`;
                const mobile = moderator.user.mobile;
                await this.twilioService.sendSms(text, mobile);
                await this.mailerService.sendMail({
                  to: moderator.email,
                  subject: 'Action Required: Auto Published Property Listings',
                  html: text,
                });

                // Check if moderator has auto-published properties three times in the same month
                const autoPublishedCount =
                  await this.autoPublishedPropertyModel.count({
                    where: {
                      moderatorId: moderator.id,
                      createdAt: {
                        [Op.gte]: new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          1,
                        ), // First day of the current month
                        [Op.lt]: new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() + 1,
                          1,
                        ),
                      },
                    },
                  });

                if (autoPublishedCount >= 3) {
                  moderatorsToUpdate.add(moderator.id);
                  const text = `Dear moderator,\n\nThis is to inform you that your status has been updated to 'Pending' due to having auto-published properties three times in the current month. Please ensure prompt moderation of all listings to maintain your moderator membership.\n\nThank you for your attention to this matter.\n\nBest regards,\n[Your Company Name]`;
                  await this.mailerService.sendMail({
                    to: moderator.email,
                    subject: 'Action Required: Update on Moderator Status',
                    html: text,
                  });
                  const mobile = moderator.user.mobile;
                  await this.twilioService.sendSms(text, mobile);
                }
              } catch (emailError) {
                console.error(
                  `Error sending email to ${moderator.email}:`,
                  emailError,
                );
              }
            });

            await Promise.all(moderatorPromises);
            // Update the status of properties to 'Publish'
            await this.propertyListModel.update(
              { status: 'Publish' },
              { where: { id } },
            );
          } catch (error) {
            throw error;
          }
        });
        await Promise.all(updatePromises);

        // Update statuses for moderators found in moderatorsToUpdate set
        const updateStatusPromises = Array.from(moderatorsToUpdate).map(
          async (moderatorId) => {
            try {
              await Moderator.update(
                { is_active_status: false },

                { where: { id: moderatorId } },
              );
            } catch (error) {
              throw error;
            }
          },
        );

        await Promise.all(updateStatusPromises);

        return ids;
      } else {
        return { message: 'No properties auto published.' };
      }
    } catch (error) {
      return error;
    }
  }

  async findByCountyId(
    countyId: number,
    paginationDto: PaginationDto,
  ): Promise<{
    properties: PropertyList[];
    totalCountry: any;
    totalPages: any;
    currentPage;
  }> {
    const { page, limit } = paginationDto;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const totalCountry = await this.propertyListModel.count({
      where: { countyId },
    });
    const totalPages = Math.ceil(totalCountry / parsedLimit);
    const properties = await this.propertyListModel.findAll({
      where: { countyId },
      offset,
      limit: parsedLimit,
    });
    if (!properties || properties.length === 0) {
      throw new NotFoundException(
        `Properties with countyId ${countyId} not found`,
      );
    }
    return {
      properties,
      totalCountry,
      totalPages,
      currentPage: parsedPage,
    };
  }

  async findById(id: number): Promise<PropertyList> {
    const property = await this.propertyListModel.findOne({
      where: { id },
      include: [
        { association: 'likedBy', attributes: ['userid'] },
        { association: 'savedPropertyBy', attributes: ['userid'] },

        {
          association: 'user',
          attributes: ['id', 'username'],
        },
        {
          association: 'county',
          attributes: ['id', 'countyName'],
        },
        {
          association: 'state',
          attributes: ['id', 'stateName'],
        },
        {
          association: 'country',
          attributes: ['id', 'name'],
        },
      ],
      attributes: {
        exclude: ['userId', 'countyId', 'stateId', 'countryId'],
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
    return property;
  }
  async findOneBySlug(slug: string, userId: number): Promise<PropertyList> {
    const properties = await this.propertyListModel.findOne({
      include: [
        { association: 'likedBy', attributes: ['userid'] },
        { association: 'savedPropertyBy', attributes: ['userid'] },
        {
          association: 'reviews',

          attributes: { exclude: ['createdAt', 'updatedAt'] },
          where: {
            [Op.or]: [
              { is_approved: true },
              ...(userId ? [{ userId: userId }] : []),
            ],
          },
          required: false,
        },

        {
          model: User,
          attributes: [
            'username',
            'mobile',
            'email',
            'firstname',
            'lastname',
            'image',
            'slug',
          ],
        },
      ],
      where: { slug },
    });
    if (!properties) {
      throw new NotFoundException(`Property with slug ${slug} not found`);
    }
    return properties;
  }

  async findByWonerId(
    id: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const limits = Number(limit);
    const offset = (page - 1) * limits;
    const properties = await PropertyList.findAndCountAll({
      include: [
        {
          model: User,
        },
        {
          model: Moderator,
          attributes: ['id', 'county'],
          include: [
            {
              include: [
                {
                  model: User,
                  attributes: ['username'],
                },
              ],
              model: moderatorRating,
              attributes: ['rating', 'description'],
            },
          ],
        },
      ],
      where: { postedBy: id },
      offset: offset,
      limit: limits,
    });

    if (properties.count === 0) {
      throw new NotFoundException(`No properties found for owner ID ${id}`);
    }

    // Calculate expiry date and remaining days for each property
    const propertiesWithExpiry = properties.rows.map((property) => {
      const postedOn = new Date(property.posted_on);
      const expiryDate = addDays(postedOn, 30);
      const remainingDays = differenceInDays(expiryDate, new Date());
      let emailMessage: any;
      if (remainingDays <= 2 && remainingDays > 0) {
        try {
          const text = `Hello, Your property ${property.propertyName} expires within ${remainingDays} days`;
          this.mailerService.sendMail({
            to: property.user.email,
            subject: 'Property Expiration information',
            html: text,
          });

          const mobile = property.user.mobile;
          this.twilioService.sendSms(text, mobile);

          emailMessage = 'Email sent successfully.';
        } catch (emailError) {
          emailMessage = `Error sending email to ${property.user.email}: ${emailError.message}`;
        }
      }
      if (remainingDays <= 0) {
        try {
          const text = `Hello, Your property ${property.propertyName} has expired`;
          this.mailerService.sendMail({
            to: property.user.email,
            subject: 'Property Expiration information',
            html: text,
          });
          const mobile = property.user.mobile;
          this.twilioService.sendSms(text, mobile);
          emailMessage = 'Email sent successfully.';
        } catch (emailError) {
          emailMessage = `Error sending email to ${property.user.email}: ${emailError.message}`;
        }
      }

      return {
        ...property.get({ plain: true }),
        expiryDate,
        remainingDays,
        emailMessage,
      };
    });

    return {
      statusCode: 200,
      message: 'Properties fetched successfully',
      data: {
        properties: propertiesWithExpiry,
        totalProperties: properties.count,
        totalPages: Math.ceil(properties.count / limit),
        currentPage: page,
      },
    };
  }

  async findAndSaveById(id: number, userId: number): Promise<any> {
    const property = await this.propertyListModel.findOne({
      where: { id: id },
    });

    if (!property) {
      throw new NotFoundException(`Property with ${id} not found`);
    }

    const exitProperty = await this.savePropertyModel.findOne({
      where: { propertyId: property.id, userId: userId },
    });

    if (exitProperty) {
      throw new ConflictException('You have already saved this property');
    }

    const saveProperty = await this.savePropertyModel.create({
      propertyId: property.id,
      userId: userId,
    });

    let moderators: any = await Moderator.findAll({
      where: {
        county: property.countyId,
        status: 'approved',
        is_active_status: true,
      },
    });
    moderators = [...moderators, { email: 'test@t.com' }];

    if (moderators.length > 0) {
      const moderator = moderators[0];

      try {
        await this.mailerService.sendMail({
          to: moderator.email,
          subject: 'Save Property Listing',
          template: 'new_property_listing',
          context: {
            moderator,
            property,
          },
        });
      } catch (emailError) {
        console.error(`Error sending email to ${moderator.email}:`, emailError);
      }
    } else {
      console.log('No approved moderators found for the county.');
    }
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Property added successfully',
      property: saveProperty,
    };
  }

  async findSavePropertyByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const numericLimit = Number(limit);
    const offset = (page - 1) * numericLimit;
    const { count, rows } = await this.savePropertyModel.findAndCountAll({
      include: [User, PropertyList],
      where: { userId: userId },
      offset: offset,
      limit: numericLimit,
    });

    if (count === 0) {
      throw new NotFoundException(`You have not save properties!`);
    }

    return {
      statusCode: 200,
      message: 'Properties fetched successfully',
      data: {
        properties: rows,
        totalProperties: count,
        totalPages: Math.ceil(count / numericLimit),
        currentPage: page,
      },
    };
  }
  async findAndSaveFavoriteById(id: number, userId: number): Promise<any> {
    const property = await this.propertyListModel.findOne({
      where: { id: id },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    const existingProperty = await this.favoritePropertyModel.findOne({
      where: { propertyId: property.id, userId: userId },
    });

    if (existingProperty) {
      throw new ConflictException('You have already favorited this property');
    }

    const savedProperty = await this.favoritePropertyModel.create({
      propertyId: property.id,
      userId: userId,
    });

    return savedProperty;
  }

  async getFavoritePropertyByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const numericLimit = Number(limit);
    const offset = (page - 1) * numericLimit;
    const { count, rows } = await this.favoritePropertyModel.findAndCountAll({
      include: [User, PropertyList],
      where: { userId: userId },
      offset: offset,
      limit: numericLimit,
    });

    if (count === 0) {
      throw new NotFoundException(`No properties found for user ID ${userId}`);
    }

    return {
      statusCode: 200,
      message: 'Properties fetched successfully',
      data: {
        properties: rows,
        totalProperties: count,
        totalPages: Math.ceil(count / numericLimit),
        currentPage: page,
      },
    };
  }

  async findAndRemoveFavoritePropertyById(
    id: number,
  ): Promise<{ message: string }> {
    const result = await this.favoritePropertyModel.destroy({
      where: { propertyId: id },
    });
    if (result) {
      return { message: 'Favorite property removed successfully.' };
    } else {
      return { message: 'Favorite property not found.' };
    }
  }

  async findAndRemoveSavePropertyById(
    id: number,
  ): Promise<{ message: string }> {
    const result = await this.savePropertyModel.destroy({
      where: { propertyId: id },
    });
    if (result) {
      return { message: 'Saved property removed successfully.' };
    } else {
      return { message: 'Saved property not found.' };
    }
  }

  async findAndExpiryExtendPropertyById(
    id: number,
    email: string,
    action_renew_property: string,
  ): Promise<any> {
    const result = await this.propertyListModel.findOne({
      where: { id },
      include: User,
    });

    if (!result) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, message: 'Property not found.' },
        HttpStatus.NOT_FOUND,
      );
    }

    const nowDate = new Date();
    const expirationDate = addDays(new Date(result.posted_on), 30);
    const remainingTime = expirationDate.getTime() - nowDate.getTime();
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

    const renew_Date = addDays(new Date(result.renew_date), 2);
    const renew_Time = renew_Date.getTime() - nowDate.getTime();
    const renew_Days = Math.ceil(renew_Time / (1000 * 60 * 60 * 24));
    if (remainingDays > 0) {
      if (renew_Days <= 0) {
        if (action_renew_property === 'Delete') {
          const renew_date = addDays(new Date(nowDate), 0);
          await result.update({
            is_deleted_property: true,
            renew_date: renew_date,
          });
          return {
            status: HttpStatus.OK,
            message: 'Property expiration extended After 2 Days.',
          };
        }
      }
      if (action_renew_property === 'Drop') {
        const originalPrice = result.price_in;
        const newPrice = originalPrice * 0.95;

        const now = new Date();
        const extendedExpiryDate = addDays(now, 0);
        const updatedResult = await result.update(
          {
            posted_on: extendedExpiryDate,
            is_deleted_property: false,
            price_in: newPrice,
          },
          { where: { id } },
        );

        let emailMessage: any;
        try {
          const text =
            'Hello, the expiration date for your property listing has been extended by 30 days.';
          await this.mailerService.sendMail({
            to: email,
            subject: 'Property Expiration Extended For Drop',
            html: text,
          });
          const mobile = result.user.mobile;
          await this.twilioService.sendSms(text, mobile);
          emailMessage = 'Email sent successfully.';
        } catch (emailError) {
          emailMessage = `Error sending email to ${email}: ${emailError.message}`;
        }
        return {
          status: HttpStatus.OK,
          message: 'Property expiration extended successfully',
          updatedProperty: updatedResult,
          emailMessage,
        };
      }

      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: `Property is not expired, ${remainingDays} days remaining until expiration.`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    const extendedExpiryDate = addDays(now, 0);

    const updatedResult = await result.update(
      { posted_on: extendedExpiryDate, is_deleted_property: false },
      { where: { id } },
    );
    let emailMessage: any;
    try {
      const text =
        'Hello, the expiration date for your property listing has been extended by 30 days.';
      await this.mailerService.sendMail({
        to: email,
        subject: 'Property Expiration Extended',
        html: text,
      });
      const mobile = result.user.mobile;
      await this.twilioService.sendSms(text, mobile);
      emailMessage = 'Email sent successfully.';
    } catch (emailError) {
      emailMessage = `Error sending email to ${email}: ${emailError.message}`;
    }
    return {
      status: HttpStatus.OK,
      message: 'Property expiration extended successfully',
      updatedProperty: updatedResult,
      emailMessage,
    };
  }
  async autoRenewProperties(): Promise<any> {
    const nowDate = new Date();
    const twoDaysAgo = addDays(nowDate, -2);

    // Find properties due for renewal
    const propertiesToRenew = await this.propertyListModel.findAll({
      where: {
        renew_date: {
          [Op.lte]: twoDaysAgo,
        },
        is_deleted_property: true,
      },
      include: User,
    });
    if (!propertiesToRenew.length) {
      return {
        status: HttpStatus.OK,
        message: 'No properties due for renewal.',
      };
    }

    for (const property of propertiesToRenew) {
      const newExpiryDate = addDays(nowDate, 0);
      await property.update({
        posted_on: newExpiryDate,
        renew_date: null,
        is_deleted_property: false,
      });
      try {
        const text = `Your property listing "${property.propertyName}" has been auto-renewed.`;
        await this.mailerService.sendMail({
          to: property.user.email,
          subject: 'Property Auto-Renewed',
          html: text,
        });
        const mobile = property.user.mobile;
        await this.twilioService.sendSms(text, mobile);
      } catch (emailError) {
        throw emailError.message;
      }
    }

    return {
      status: HttpStatus.OK,
      message: `${propertiesToRenew.length} properties auto-renewed successfully.`,
    };
  }
  ///-----------------------
  async renewPayPropertyById(propertyId: number): Promise<any> {
    const property = await this.propertyListModel.findOne({
      where: {
        id: propertyId,
        is_deleted_property: false,
      },
      include: User,
    });
    if (!property) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Property not found or is already renewed.',
        data: null,
      };
    }
    const nowDate = new Date();
    const newExpiryDate = addDays(nowDate, 0);
    await property.update({
      posted_on: newExpiryDate,
      is_deleted_property: false,
    });
    try {
      const text = `Your property listing "${property.propertyName}" has been successfully renewed.`;
      await this.mailerService.sendMail({
        to: property.user.email,
        subject: 'Property Renewed Successfully',
        html: text,
      });
      const mobile = property.user.mobile;
      await this.twilioService.sendSms(text, mobile);
    } catch (emailError) {
      throw emailError.message;
    }

    return {
      status: HttpStatus.OK,
      message: `Property with ID ${propertyId} has been successfully renewed.`,
      data: property,
    };
  }

  async getFilteredProperties(
    price_min: number,
    price_max: number,
    type: string,
    propertyId: string,
    bedrooms: number,
    bathrooms: number,
    location: string,
    square_min: number,
    square_max: number,
  ): Promise<any[]> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const whereClause: any = {
      status: 'Publish',
      posted_on: { [Op.gte]: thirtyDaysAgo },
    };

    if (price_min && price_max) {
      whereClause.price_in = { [Op.between]: [price_min, price_max] };
    }
    if (type) {
      whereClause.select_Category = type;
    }
    if (propertyId) {
      whereClause.custom_id = propertyId;
    }
    if (bedrooms) {
      whereClause.bedrooms = bedrooms;
    }
    if (bathrooms) {
      whereClause.bathrooms = bathrooms;
    }

    if (location) {
      whereClause.city = location;
    }

    if (square_min && square_max) {
      whereClause.size_in_ft = { [Op.between]: [square_min, square_max] };
    }
    const properties = await this.propertyListModel.findAll({
      where: whereClause,
    });

    return properties;
  }

  async findAndUpgradPropertyById(id: number): Promise<PropertyList> {
    const result = await this.propertyListModel.findOne({ where: { id } });

    if (!result) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    if (result.status !== 'Publish') {
      throw new BadRequestException(`Only publish properties can be featured`);
    }

    const now = new Date();
    const upgradDate = addDays(now, 0);
    await result.update(
      {
        featured_property: true,
        featuredAt: upgradDate,
      },
      {
        silent: true,
      },
    );

    return result;
  }

  async findAndDeleteExpiredProperty(): Promise<PropertyList[]> {
    const queryDate = new Date();
    queryDate.setDate(queryDate.getDate() - 60);
    console.log(queryDate);

    const propertiesToDelete = await this.propertyListModel.findAll({
      where: {
        where: literal(
          `MONTH(posted_on) = ${queryDate.getMonth() + 1} AND DAY(posted_on) = ${queryDate.getDate()}`,
        ),
      },
    });
    await this.propertyListModel.destroy({
      where: {
        id: propertiesToDelete.map((property) => property.id),
      },
    });

    return propertiesToDelete;
  }

  async sendReminderMsgToContractedProperties(): Promise<any> {
    try {
      const currentDate = moment().utc();

      const currentDateEST = currentDate.tz('America/New_York');
      const formattedCurrentDate = currentDateEST.format('YYYY-MM-DD');

      const reminder48HoursStart = currentDateEST
        .clone()
        .add(48, 'hours')
        .startOf('hour');
      const reminder48HoursEnd = reminder48HoursStart.clone().endOf('hour');
      const reminder24HoursStart = currentDateEST
        .clone()
        .add(24, 'hours')
        .startOf('hour');
      const reminder24HoursEnd = reminder24HoursStart.clone().endOf('hour');
      const propertiesToRemind48Hours = await this.propertyListModel.findAll({
        where: {
          status: 'Contract',
          end_contract: {
            [Op.between]: [
              reminder48HoursStart.toDate(),
              reminder48HoursEnd.toDate(),
            ],
          },
        },
        include: User,
      });
      const propertiesToRemind24Hours = await this.propertyListModel.findAll({
        where: {
          status: 'Contract',
          end_contract: {
            [Op.between]: [
              reminder24HoursStart.toDate(),
              reminder24HoursEnd.toDate(),
            ],
          },
        },
        include: User,
      });
      const contractedProperties = await this.propertyListModel.findAll({
        where: literal(`DATE(end_contract) = '${formattedCurrentDate}'`),
        include: [User],
      });

      // Schedule email to be sent at 7 AM
      cron.schedule('0 7  * * *', async () => {
        const emailPromises = contractedProperties.map(async (property) => {
          try {
            const text = `Congratulations! Your property "${property.propertyName}" contract has been completed`;
            await this.mailerService.sendMail({
              to: property.user.email,
              subject: 'Contract Completion Notification',
              html: text,
            });
            const mobile = property.user.mobile; // Recipient's mobile number
            await this.twilioService.sendSms(text, mobile);
          } catch (emailError) {
            throw emailError.message;
          }
        });

        try {
          await Promise.all(emailPromises);
          console.log('All 7 AM reminder emails sent successfully.');
        } catch (sendAllError) {
          throw sendAllError.message;
        }
      });

      // Send immediate emails for properties to remind after 48 hours
      if (propertiesToRemind48Hours.length > 0) {
        const emailPromises48Hours = propertiesToRemind48Hours.map(
          async (property) => {
            try {
              const text = `Congratulations! Your property "${property.propertyName}" contract will be completed in 48 hours.`;
              await this.mailerService.sendMail({
                to: property.user.email,
                subject: 'Contract Completion Notification',
                html: text,
              });
              const mobile = property.user.mobile; // Recipient's mobile number
              await this.twilioService.sendSms(text, mobile);
            } catch (emailError) {
              throw emailError.message;
            }
          },
        );

        try {
          await Promise.all(emailPromises48Hours);
          console.log('All 48-hour reminder emails sent successfully.');
        } catch (sendAllError) {
          throw sendAllError.message;
        }
      }

      // Send immediate emails for properties to remind after 24 hours
      if (propertiesToRemind24Hours.length > 0) {
        const emailPromises24Hours = propertiesToRemind24Hours.map(
          async (property) => {
            try {
              const text = `Congratulations! Your property "${property.propertyName}" contract will be completed in 24 hours.`;
              await this.mailerService.sendMail({
                to: property.user.email,
                subject: 'Contract Completion Notification',
                html: text,
              });
              const mobile = property.user.mobile; // Recipient's mobile number
              await this.twilioService.sendSms(text, mobile);
            } catch (emailError) {
              throw emailError.message;
            }
          },
        );

        try {
          await Promise.all(emailPromises24Hours);
          console.log('All 24-hour reminder emails sent successfully.');
        } catch (sendAllError) {
          throw sendAllError.message;
        }
      }

      // Return contracted properties for further processing if needed
      return {
        message: 'Email notifications sent successfully.',
        contractedProperties: contractedProperties,
        propertiesToRemind48Hours: propertiesToRemind48Hours,
        propertiesToRemind24Hours: propertiesToRemind24Hours,
      };
    } catch (error) {
      console.error('Error sending contract completion notifications:', error);
      throw error; // Handle or log the error as per your application's error handling strategy
    }
  }

  async deletePropertyBySeller(
    propertyId: number,
    sellerId: number,
  ): Promise<any> {
    const property = await this.propertyListModel.findOne({
      where: { id: propertyId, postedBy: sellerId, status: 'Hold' },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const moderators = await Moderator.findAll({
      where: { county: property.countyId },
      include: User,
    });

    moderators.map((moderator) => {
      try {
        const text = `The following property with status 'Hold' has been deleted for seller with ID ${sellerId}: ${property.propertyName}`;
        this.mailerService.sendMail({
          to: moderator.email,
          subject: 'Property Deletion Notification',
          html: text,
        });
        const mobile = moderator.user.mobile;
        this.twilioService.sendSms(text, mobile);
      } catch (error) {
        throw error.message;
      }
    });

    await property.destroy();

    return {
      message: `Property with ID ${propertyId} has been successfully deleted.`,
    };
  }

  async autoPublishHoldProperties(): Promise<any> {
    const twentyFourHoursAgo = moment()
      .subtract(0, 'hours')
      .format('MM/DD/YYYY, hh:mm:ss A');
    const properties = await this.propertyListModel.findAll({
      where: {
        status: 'Hold',
        hold_duration: {
          [Op.lte]: twentyFourHoursAgo,
        },
      },
    });
    if (properties.length === 0) {
      throw new NotFoundException(
        `No properties found in 'Hold' status for more than 24 hours`,
      );
    }
    const updatedProperties = [];
    for (const property of properties) {
      try {
        const moderators = await Moderator.findAll({
          where: { county: property.countyId },
          include: User,
        });

        for (const moderator of moderators) {
          const startOfMonth = moment().startOf('month').toDate();
          const endOfMonth = moment().endOf('month').toDate();

          const autoPublishedCount =
            await this.autoPublishedPropertyModel.count({
              where: {
                moderatorId: moderator.id,

                createdAt: {
                  [Op.between]: [startOfMonth, endOfMonth],
                },
              },
            });
          if (autoPublishedCount >= 3) {
            try {
              await Moderator.update(
                { is_active_status: false },

                { where: { id: moderator.id } },
              );

              try {
                const text = `Dear moderator,\n\nThis is to inform you that your status has been updated to 'Pending' due to having auto-published properties three times in the current month. Please ensure prompt moderation of all listings to maintain your moderator membership.\n\nThank you for your attention to this matter.\n\nBest regards,\n[Your Company Name]`;
                this.mailerService.sendMail({
                  to: moderator.email,
                  subject: 'Action Required: Update on Moderator Status',
                  html: text,
                });
                const mobile = moderator.user.mobile;
                this.twilioService.sendSms(text, mobile);
              } catch (error) {
                throw error;
              }
            } catch (error) {
              throw error;
            }
          }
          await this.autoPublishedPropertyModel.create({
            propertyId: property.id,
            moderatorId: moderator.id,
            auto_published_charge: '75',
            property_pre_status: property.status,
          });
        }
        property.status = 'Publish';
        await property.update({ status: 'Publish' });
        console.log(`Property ID ${property.id} status updated to Published`);
        updatedProperties.push(property);
        for (const moderator of moderators) {
          try {
            const text = `The property with ID ${property.propertyName} has been automatically published..`;
            await this.mailerService.sendMail({
              to: moderator.email,
              subject: 'Property Status Update Notification',
              html: text,
            });
            const mobile = moderator.user.mobile;
            await this.twilioService.sendSms(text, mobile);
          } catch (emailError) {
            throw emailError;
          }
        }
      } catch (propertyError) {
        throw propertyError;
      }
    }

    return updatedProperties;
  }
  async searchProperties(
    propertyName?: string,
    postedBy?: number,
  ): Promise<PropertyList[]> {
    const whereConditions: any = {};

    if (propertyName) {
      whereConditions.propertyName = {
        [Op.like]: `%${propertyName}%`,
      };
    }
    if (postedBy) {
      whereConditions.postedBy = postedBy;
    }
    return this.propertyListModel.findAll({
      where: whereConditions,
    });
  }
  async getCountiesFromPropertylist(): Promise<any> {
    const counties = await this.propertyListModel.findAll({
      attributes: ['countyId'],
    });
    const uniqueCountyIds = [
      ...new Set(counties.map((county) => county.countyId)),
    ];
    return uniqueCountyIds;
  }
  async deletePropertyById(id: number, userId: number): Promise<any> {
    const result = await this.propertyListModel.destroy({
      where: {
        id,
        postedBy: userId,
      },
    });

    if (result) {
      return { message: 'Property deleted successfully.' };
    } else {
      return {
        message:
          'Property not found or you are not authorized to delete this property.',
      };
    }
  }

  async setPropertyToActiveInActive(id: number): Promise<any> {
    const property = await this.propertyListModel.findOne({ where: { id } });
    if (!property) {
      return { message: 'Property not found.' };
    }
    if (property.property_Status === 'Active') {
      property.property_Status = 'In-Active';
    } else if (property.property_Status === 'In-Active') {
      property.property_Status = 'Active';
    } else {
      return { message: 'Property status is neither Active nor Non-Active.' };
    }
    await property.save();
    return {
      message: `Property status updated to ${property.property_Status}.`,
    };
  }
  async createLeads(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = await Lead.create(createLeadDto);
    return lead;
  }

  async findAll(): Promise<Lead[]> {
    return await Lead.findAll();
  }

  async findLeadByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ leads: Lead[]; totalLeads: number }> {
    limit = Number(limit);
    const offset = (page - 1) * limit;
    const { count: totalLeads, rows: leads } = await Lead.findAndCountAll({
      where: {
        userId: userId,
      },
      offset,
      limit,
    });

    return { leads, totalLeads };
  }

  async deleteLeadsByUserId(id: number, userId: number): Promise<number> {
    const deletedCount = await Lead.destroy({
      where: {
        id,
        userId,
      },
    });
    return deletedCount;
  }

  async sendEmailAndTextForLead(
    email: string,
    email_user: string,
    mobile: string,
    title: string,
    description: string,
  ): Promise<void> {
    const htmlContent = `
         <html>
    <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
      <h2 style="color: #4CAF50;">${title}</h2>

      <p><strong>From:</strong> ${email}</p>
      <p><strong>To:</strong> ${email_user}</p>

      <hr style="border: 0; height: 1px; background-color: #ddd;">

      <p>${description}</p>

      <p>Best regards,<br>
      REHABLOOP Team</p>
    </body>
    </html>
    `;
    // Send email
    await this.mailerService.sendMail({
      to: email_user,
      subject: title,
      html: htmlContent,
    });

    // Send SMS
    const text = description;
    await this.twilioService.sendSms(text, mobile);
  }

  async searchAddressesByAddress(address: string): Promise<string[]> {
    const properties = await this.propertyListModel.findAll({
      where: {
        address: {
          [Op.like]: `%${address}%`,
        },
      },
      attributes: ['address'],
    });
    return properties.map((property) => property.address);
  }

  async searchAllProperties(
    page: number = 1,
    limit: number = 10,
    search: string,
  ): Promise<{
    properties: PropertyList[];
    totalPages: number;
    totalProperties: number;
    currentPage: number;
  }> {
    limit = Number(limit) || 10;
    const offset = (page - 1) * limit;

    // Prepare the search query
    const searchQuery = search?.toLowerCase().trim();

    // Fetch properties with search applied
    const { count: totalProperties, rows: properties } =
      await this.propertyListModel.findAndCountAll({
        include: [
          {
            association: 'user',
            attributes: ['id', 'username', 'mobile', 'image'],
          },
          {
            association: 'state',
            attributes: ['id', 'stateName'],
            where: {
              stateName: { [Op.like]: `%${searchQuery}%` }, // Search in stateName
            },
            required: false,
          },
          {
            association: 'county',
            attributes: ['id', 'countyName'],
            where: {
              countyName: { [Op.like]: `%${searchQuery}%` }, // Search in countyName
            },
            required: false,
          },
          {
            association: 'country',
            attributes: ['id', 'name'],
          },
        ],
        attributes: {
          exclude: ['userId', 'countyId', 'stateId', 'countryId'],
        },
        where: {
          status: 'Publish',
          [Op.or]: [
            { propertyName: { [Op.like]: `%${searchQuery}%` } }, // Search in propertyName
            { propertyTitle: { [Op.like]: `%${searchQuery}%` } },
            { city: { [Op.like]: `%${searchQuery}%` } },
            { select_Category: { [Op.like]: `%${searchQuery}%` } },
          ],
        },
        offset,
        limit,
      });

    const totalPages = Math.ceil(totalProperties / limit);
    const currentPage = page;

    return { properties, totalPages, totalProperties, currentPage };
  }

  async startBiding(
    id: number,
    ownerId: number,
    startBiddingDto: StartBidingDto,
  ) {
    const property = await this.propertyListModel.findOne({
      where: { id: id, postedBy: ownerId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }



    // Set the timezone to 'Etc/UTC' and format the time as required
    // const propertyBidStart = moment
    //   .tz(startBiddingDto.property_bid_start, 'Etc/UTC')
    //   .toDate();
    // const propertyBidEnd = moment
    //   .tz(startBiddingDto.property_bid_end, 'Etc/UTC')
    //   .toDate();

const givenDate = '2024-09-10 17:33:00'
      const sourceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Create a moment object with the given time and time zone
      const localTime = moment.tz(givenDate, "YYYY-MM-DD HH:mm:ss", sourceTimeZone);
      
      // Convert this time to UTC
      const utcTimeForStartBiding = localTime.clone().tz("Etc/UTC").format('YYYY-MM-DD HH:mm:ss');

      console.log(utcTimeForStartBiding , 'utcTimeForStartBidingutcTimeForStartBiding');
      
      

      const localEndTime = moment.tz(startBiddingDto.property_bid_end, "YYYY-MM-DD HH:mm:ss", sourceTimeZone);
      
      // Convert this time to UTC
      const utcTimeForEndBiding = localEndTime.clone().tz("Etc/UTC").format('YYYY-MM-DD HH:mm:ss');
      
  


    // Update property with bidding details
    property.property_bid_start = startBiddingDto.property_bid_start;
    property.property_bid_end = startBiddingDto.property_bid_end;
    property.min_bid_amount = startBiddingDto.min_bid_amount;
    property.bid_title = startBiddingDto.bid_title;
    property.bid_description = startBiddingDto.bid_description;


    console.log(property , 'property details here');
    
    await property.save();

    // Convert dates to cron format using moment
    const bidStartTime = moment.utc(property.property_bid_start);
    const bidEndTime = moment.utc(property.property_bid_end);

    // Schedule a cron job for the start of bidding
    cron.schedule(
      `${bidStartTime.seconds()} ${bidStartTime.minutes()} ${bidStartTime.hours()} ${bidStartTime.date()} ${bidStartTime.month() + 1} *`,
      async () => {
        try {
          console.log(`Bidding started for property with ID: ${property.id}`);
          // Mark the bidding as active
          property.is_under_biding = true;
          await property.save();
        } catch (error) {
          console.error('Error during bidding start:', error);
        }
      },
    );

    // Schedule a cron job for the end of bidding
    cron.schedule(
      `${bidEndTime.seconds()} ${bidEndTime.minutes()} ${bidEndTime.hours()} ${bidEndTime.date()} ${bidEndTime.month() + 1} *`,
      async () => {
        try {
          console.log(`Bidding ended for property with ID: ${property.id}`);

          // Mark the bidding as inactive
          property.is_under_biding = false;
          await property.save();
        } catch (error) {
          console.error('Error during bidding end:', error);
        }
      },
    );

    return {
      statusCode: 200,
      message: 'Bidding started successfully',
      data: property,
    };
  }
}
