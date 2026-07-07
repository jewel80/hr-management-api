import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { PaginatedAttendanceDto } from './dto/paginated-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'List attendance records (filterable)' })
  @ApiOkResponse({
    type: PaginatedAttendanceDto,
    description: 'Paginated attendance records.',
  })
  findMany(@Query() query: QueryAttendanceDto): Promise<PaginatedAttendanceDto> {
    return this.attendanceService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single attendance record' })
  @ApiOkResponse({ type: AttendanceResponseDto })
  @ApiNotFoundResponse({ description: 'Attendance record not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AttendanceResponseDto> {
    return this.attendanceService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Upsert attendance: inserts, or updates check_in_time when (employeeId, date) exists',
  })
  @ApiCreatedResponse({
    type: AttendanceResponseDto,
    description: 'Attendance created or updated.',
  })
  @ApiNotFoundResponse({ description: 'Referenced employee not found.' })
  @ApiConflictResponse({ description: 'Concurrent upsert could not be resolved.' })
  create(@Body() dto: CreateAttendanceDto): Promise<AttendanceResponseDto> {
    return this.attendanceService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an attendance record' })
  @ApiOkResponse({ type: AttendanceResponseDto })
  @ApiNotFoundResponse({ description: 'Attendance record not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an attendance record' })
  @ApiOkResponse({ description: 'Attendance record deleted.' })
  @ApiNotFoundResponse({ description: 'Attendance record not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.attendanceService.remove(id);
  }
}
