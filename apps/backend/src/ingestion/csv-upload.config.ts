import { memoryStorage } from 'multer';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type FileFilterCb = (error: Error | null, acceptFile: boolean) => void;

export const CSV_MULTER_OPTIONS = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: FileFilterCb) => {
    const isCsv =
      file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.csv');
    if (isCsv) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'), false);
    }
  },
};
