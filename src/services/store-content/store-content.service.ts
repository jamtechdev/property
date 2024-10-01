import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import BannerOptions from 'models/banner.options.model';
import StoreContent from 'models/storecontent.model';
import {
  CreateBannerOptionsDto,
  CreateStoreContentDto,
} from 'src/dto/storeContent/storeContent.dto';

@Injectable()
export class StoreContentService {
  constructor(
    @InjectModel(StoreContent)
    private readonly StoreContentModel: typeof StoreContent,
    @InjectModel(BannerOptions)
    private readonly bannerOptionsModel: typeof BannerOptions,
  ) {}

  async createStoreContent(
    createStoreContentDto: CreateStoreContentDto,
  ): Promise<StoreContent> {
    return await this.StoreContentModel.create(createStoreContentDto);
  }

  async findStoreContent(): Promise<any> {
    return await this.StoreContentModel.findOne({
      order: [['createdAt', 'DESC']],
    });
  }
  async createOption(
    createBannerOptionsDto: CreateBannerOptionsDto,
  ): Promise<BannerOptions> {
    return this.bannerOptionsModel.create(createBannerOptionsDto);
  }

  async getAllOptions(): Promise<BannerOptions[]> {
    return await BannerOptions.findAll();
  }

  async findBannerOptionByUserId(userId: number): Promise<BannerOptions> {
    const bannerOption = await this.bannerOptionsModel.findOne({
      where: { userId },
    });

    if (!bannerOption) {
      throw new NotFoundException('Banner option not found');
    }

    return bannerOption;
  }

  async updateBannerOptionByUserId(
    userId: number,
    updateBannerOptionsDto: CreateBannerOptionsDto,
  ): Promise<BannerOptions> {
    const bannerOption = await this.bannerOptionsModel.findOne({
      where: { userId },
    });

    if (!bannerOption) {
      throw new NotFoundException('Banner option not found');
    }

    return bannerOption.update(updateBannerOptionsDto);
  }
}
