import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const err =
      exception.code === 'LIMIT_FILE_SIZE'
        ? new BadRequestException('File exceeds 10 MB limit')
        : new BadRequestException(exception.message);
    response.status(err.getStatus()).json(err.getResponse());
  }
}
