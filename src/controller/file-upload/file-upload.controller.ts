// file-upload.controller.ts

import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../../services/file-upload/file-upload.service';

@Controller('files')
export class FileUploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @Post('upload')
  @UseInterceptors(FilesInterceptor('file')) // 'files' should match the field name in form-data
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]): Promise<{ url: string[] }> {
    const bucketName = 'rehabloop'; // Replace with your S3 bucket name

    const uploadPromises = files.map(file => this.s3Service.uploadFile(file, bucketName));
    const urls = await Promise.all(uploadPromises);
    
    return { url: urls };
  }
}
