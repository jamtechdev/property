import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreatePropertyBidingDto } from 'src/dto/propertyBid/property-biding.dto';
import { PropertyBidingService } from 'src/services/property-biding/property-biding.service';

@Controller('property-biding')
export class PropertyBidingController {
  constructor(readonly propertyBidingServices: PropertyBidingService) {}

  @Post('post-bid')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createPropertyBidingDto: CreatePropertyBidingDto) {
    return this.propertyBidingServices.createPropertyBid(
      createPropertyBidingDto,
    );
  }

  @Get('get-all-bids')
  async findAllBids(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    return this.propertyBidingServices.findAllBids(pageNumber, limitNumber);
  }

  @Get('get-bid/:id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.propertyBidingServices.findOneBid(id, userId);
  }

  @Patch('update-bid/:id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: number,
    @Body('userId') userId: number,
    @Body() updatePropertyBidingDto: CreatePropertyBidingDto,
  ) {
    return await this.propertyBidingServices.updateBid(
      id,
      userId,
      updatePropertyBidingDto,
    );
  }

  @Delete('delete-bid/:id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: number, @Body('userId') userId: number) {
    return await this.propertyBidingServices.removeBid(id, userId);
  }

  @Get('user-bids/:userId')
  @UseGuards(AuthGuard('jwt'))
  async findAllBidsByUser(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userIdNumber = parseInt(userId);
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    return this.propertyBidingServices.findAllBidsByUser(
      userIdNumber,
      pageNumber,
      limitNumber,
    );
  }

  @Get('bid-property/:propertyId')
  async findAllBidsByProperty(
    @Param('propertyId') propertyId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const propertyIdNumber = parseInt(propertyId);
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    return this.propertyBidingServices.findAllBidsByProperty(
      propertyIdNumber,
      pageNumber,
      limitNumber,
    );
  }
}
