import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
  HttpStatus,
  HttpException,
  UploadedFile,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor, MulterModuleOptions } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../../services/uploadFiles/upload-file.service';
import { Request } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}
  configureUpload(): MulterModuleOptions {
    return this.fileUploadService.createMulterOptions();
  }

  @Post('add-property-images')
  // @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('images', 10))
  async addImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: Request,
  ) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('File upload failed', HttpStatus.BAD_REQUEST);
      }

      const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
      const images = files.map((file) => `${baseUrl}/${file.filename}`);
      const imageUrl = JSON.stringify(images);

      return {
        statusCode: HttpStatus.OK,
        message: 'Property images uploaded successfully',
        filePaths: imageUrl,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  @Post('add-banner-images')

  async addBannerImages(
    @Body('imageUrl') imageUrl: string, // Assuming 'imageUrl' is the key where the URL is passed
 
  ) {
    try {
      if (!imageUrl) {
        throw new HttpException('Image URL not provided', HttpStatus.BAD_REQUEST);
      }

      const savedImageUrl = await this.fileUploadService.saveImageUrl(imageUrl);

  
      return {
        statusCode: HttpStatus.OK,
        message: 'Image URL processed successfully',
        savedImageUrl: savedImageUrl, // If you need to return the processed URL
      };
    } catch (error) {


      
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
  
  @Get('get-banner-images')
  async getBannerImages() {
    try {
      const uploadedImages =
        await this.fileUploadService.findUploadBannerImages();

      return {
        statusCode: HttpStatus.OK,

        lastImage: uploadedImages || null,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }


  @Post('upload-video')
  // @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('video'))
  async addVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: Request,
  ) {
    try {
      if (!file) {
        throw new HttpException('File upload failed', HttpStatus.BAD_REQUEST);
      }
      const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
       const images = `${baseUrl}/${file.filename}`;
      const imageUrl = JSON.stringify(images);

      return {
        statusCode: HttpStatus.OK,
        message: 'video uploaded successfully',
        filePaths: imageUrl,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
