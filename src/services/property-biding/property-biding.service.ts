import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import propertyBiding from 'models/property.biding.model';
import PropertyList from 'models/propertylist.model';
import User from 'models/user.model';
import { CreatePropertyBidingDto } from 'src/dto/propertyBid/property-biding.dto';

@Injectable()
export class PropertyBidingService {
  constructor(
    @InjectModel(propertyBiding)
    private readonly propertyBidingModel: typeof propertyBiding,
  ) {}

  async createPropertyBid(
    createPropertyBidingDto: CreatePropertyBidingDto,
  ): Promise<any> {
    const { userId, propertyId } = createPropertyBidingDto;

    // Check if a bid already exists for the same userId and propertyId
    const existingBiding = await this.propertyBidingModel.findOne({
      where: { userId, propertyId },
    });

    if (existingBiding) {
      await existingBiding.update({ amount: createPropertyBidingDto.amount });
      return {
        statusCode: HttpStatus.OK,
        message: 'Property biding updated successfully',
        data: existingBiding,
      };
    }
    const newBiding = await this.propertyBidingModel.create(
      createPropertyBidingDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Property biding created successfully',
      data: newBiding,
    };
  }

  async findAllBids(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.propertyBidingModel.findAndCountAll({
      attributes: ['id', 'amount', 'is_paid'],
      include: [
        {
          model: PropertyList,
          attributes: [
            'id',
            'propertyName',
            'propertyTitle',
            'price_in',
            'property_bid_start',
            'property_bid_end',
            'is_under_biding',
            'min_bid_amount',
            'bid_title',
            'bid_description',
          ],
        },
        { model: User, attributes: ['username', 'company_name'] },
      ],

      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Property bidings retrieved successfully',
      data: rows,
      totalItems: count,
      totalPages,
      currentPage: page,
      pageSize: limit,
    };
  }

  async findAllBidsByUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;
    const { count, rows } = await this.propertyBidingModel.findAndCountAll({
      attributes: ['id', 'amount', 'is_paid'],
      include: [
        {
          model: PropertyList,
          attributes: [
            'id',
            'propertyName',
            'propertyTitle',
            'price_in',
            'property_bid_start',
            'property_bid_end',
            'is_under_biding',
            'min_bid_amount',
            'bid_title',
            'bid_description',
          ],
        },
        { model: User, attributes: ['username', 'company_name'] },
      ],
      where: { userId },
      limit,
      offset,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Property bidings for the user retrieved successfully',
      data: {
        bids: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  }

  async findOneBid(id: number, userId: number) {
    const biding = await this.propertyBidingModel.findOne({
      where: { id: id, userId: userId },
    });
    if (!biding) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Biding not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Property biding retrieved successfully',
      data: biding,
    };
  }

  async updateBid(
    id: number,
    userId: number,
    updatePropertyBidingDto: CreatePropertyBidingDto,
  ) {
    const existingBid = await this.propertyBidingModel.findOne({
      where: { id: id, userId: userId },
    });
    if (!existingBid) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Biding not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    await existingBid.update(updatePropertyBidingDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Property biding updated successfully',
      data: existingBid,
    };
  }

  async removeBid(id: number, userId: number) {
    const biding = await this.propertyBidingModel.findOne({
      where: { id: id, userId: userId },
    });

    if (!biding) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Property bidding not found',
      };
    }
    await biding.destroy();

    return {
      statusCode: HttpStatus.OK,
      message: 'Property biding deleted successfully',
    };
  }
  async findAllBidsByProperty(
    propertyId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;

    // Fetch the property with total bids count and details
    const property = await PropertyList.findOne({
      attributes: [
        'id',
        'propertyName',
        'propertyTitle',
        'price_in',
        'property_bid_start',
        'property_bid_end',
        'is_under_biding',
        'min_bid_amount',
        'bid_title',
        'bid_description',
      ],
      where: { id: propertyId, is_under_biding: true },
      include: [
        {
          model: propertyBiding,
          as: 'users', // Use the alias defined in the model association
          attributes: ['id', 'amount', 'is_paid'],
          include: [
            {
              model: User,
              attributes: ['username', 'company_name'],
            },
          ],
        },
      ],
    });

    if (!property) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Property not found or is not under bidding',
        data: null,
      };
    }

    // Manually paginate bids
    const allBids = property.users; // Use the correct alias here
    const paginatedBids = allBids.slice(offset, offset + limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Property bidings for the property retrieved successfully',
      data: {
        property: {
          id: property.id,
          propertyName: property.propertyName,
          propertyTitle: property.propertyTitle,
          price_in: property.price_in,
          property_bid_start: property.property_bid_start,
          property_bid_end: property.property_bid_end,
          is_under_biding: property.is_under_biding,
          min_bid_amount: property.min_bid_amount,
          bid_title: property.bid_title,
          bid_description: property.bid_description,
          users: paginatedBids,
          total: allBids.length,
          totalPages: Math.ceil(allBids.length / limit),
          currentPage: page,
        },
      },
    };
  }
}
