import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

// Define the maximum file size (e.g., 50 MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads', // Specify your desired upload directory
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);

      if (!ext) {
        throw new BadRequestException('File has no extension');
      }
      callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE, // Set file size limit
  },
  fileFilter: (req, file, callback) => {
    // Example file type filter (optional)
    if (!file.mimetype.startsWith('image/')) {
      return callback(new BadRequestException('Only image files are allowed'), false);
    }
    callback(null, true);
  },
};
