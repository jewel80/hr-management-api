import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import { Employee } from '../database/entities/employee.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = config.get<string>('app.uploadDir') ?? './uploads';
        const maxBytes = config.get<number>('app.uploadMaxBytes') ?? 5_242_880;

        return {
          storage: diskStorage({
            destination: async (
              _req,
              _file,
              cb: (error: Error | null, destination: string) => void,
            ) => {
              const absolute = join(process.cwd(), uploadDir);
              await mkdir(absolute, { recursive: true });
              cb(null, absolute);
            },
            filename: (
              _req,
              file,
              cb: (error: Error | null, filename: string) => void,
            ) => {
              const extension = extname(file.originalname) || '';
              cb(null, `${randomUUID()}${extension}`);
            },
          }),
          limits: { fileSize: maxBytes },
          fileFilter: (
            _req,
            file,
            cb: (error: Error | null, acceptFile: boolean) => void,
          ) => {
            if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
              cb(null, true);
            } else {
              cb(
                new BadRequestException(
                  'Only image files (png, jpg, jpeg, gif, webp) are allowed.',
                ),
                false,
              );
            }
          },
        };
      },
    }),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
