import { Injectable, Req } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import { multerConfig } from './multer.config';
import { Request } from 'express';
import BannerImages from 'models/banner.images.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class FileUploadService implements MulterOptionsFactory {
  @InjectModel(BannerImages)
  private readonly bannerImagesModel: typeof BannerImages;
  createMulterOptions(): MulterModuleOptions {
    return multerConfig;
  }

  async saveFiles(files: Express.Multer.File[]): Promise<string[]> {
    return files.map((file) => file.path);
  }
  async saveImageUrl(imageUrl: any): Promise<any> {
    try {
      return this.bannerImagesModel.create({ banner_images: imageUrl });
    } catch (error) {
      console.log(error);
    }
  }

  async findUploadBannerImages(): Promise<any> {
    return await this.bannerImagesModel.findOne({
      order: [['createdAt', 'DESC']],
    });
  }

  async saveVideo(file: Express.Multer.File): Promise<string> {
    return file.path;
  }
}
