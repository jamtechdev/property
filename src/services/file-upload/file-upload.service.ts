// file-upload.service.ts

import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3();
  }

  async uploadFile(
    file: Express.Multer.File,
    bucketName: string,
  ): Promise<string> {
    const params = {
      Bucket: bucketName,
      Key: `uploads/${file.originalname}`,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };

    try {
      const data = await this.s3.upload(params).promise();
      this.cleanupLocalFile(file.path);
      return data.Location;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  private cleanupLocalFile(filePath: string) {
    const resolvedPath = path.resolve(filePath);
    fs.unlinkSync(resolvedPath);
    console.log(`Deleted local file: ${resolvedPath}`);
  }
}
