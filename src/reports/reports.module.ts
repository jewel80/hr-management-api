import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../database/entities/attendance.entity';
import { Employee } from '../database/entities/employee.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Employee])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
