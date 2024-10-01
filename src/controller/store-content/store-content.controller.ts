import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Param,
  Put,
} from '@nestjs/common';
import BannerOptions from 'models/banner.options.model';
import {
  CreateBannerOptionsDto,
  CreateStoreContentDto,
} from 'src/dto/storeContent/storeContent.dto';
import { StoreContentService } from 'src/services/store-content/store-content.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('store-content')
export class StoreContentController {
  constructor(private readonly storeContentService: StoreContentService) {}

  @Post('create-storeContent')
  // @UseGuards(AuthGuard('jwt'))
  async create(@Body() createStoreContentDto: CreateStoreContentDto) {
    return this.storeContentService.createStoreContent(createStoreContentDto);
  }

  @Get('get-storeContent')
  async getStoreContent() {
    try {
      const storeContent = await this.storeContentService.findStoreContent();
      return storeContent;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
  @Post('post-banner-option')
  @HttpCode(HttpStatus.CREATED)
  // @UseGuards(AuthGuard('jwt'))
  async createBannerOption(
    @Body() createBannerOptionsDto: CreateBannerOptionsDto,
  ): Promise<{ statusCode: number; message: string; data: BannerOptions }> {
    const bannerOption = await this.storeContentService.createOption(
      createBannerOptionsDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Banner option created successfully',
      data: bannerOption,
    };
  }

  @Get('get-banner-options')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(AuthGuard('jwt'))
  async getAllBannerOptions(): Promise<{
    statusCode: number;
    data: BannerOptions[];
  }> {
    const bannerOptions = await this.storeContentService.getAllOptions();
    return {
      statusCode: HttpStatus.OK,
      data: bannerOptions,
    };
  }

  @Get('get-banner-options/:userId')
  // @UseGuards(AuthGuard('jwt'))
  async getBannerOptionByUserId(
    @Param('userId') userId: number,
  ): Promise<{ statusCode: number; message: string; data: BannerOptions }> {
    const bannerOption =
      await this.storeContentService.findBannerOptionByUserId(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Banner option retrieved successfully',
      data: bannerOption,
    };
  }
  @Put('update-banner-options/:userId')
  @UseGuards(AuthGuard('jwt'))
  async updateBannerOptionByUserId(
    @Param('userId') userId: number,
    @Body() updateBannerOptionsDto: CreateBannerOptionsDto,
  ): Promise<{ statusCode: number; message: string; data: BannerOptions }> {
    const updatedBannerOption =
      await this.storeContentService.updateBannerOptionByUserId(
        userId,
        updateBannerOptionsDto,
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Banner option updated successfully',
      data: updatedBannerOption,
    };
  }
}
