import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceReportDto } from './dto/attendance-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('attendance')
  @ApiOperation({
    summary:
      'Monthly attendance report: days present and times late (> 09:45:00) per employee',
  })
  @ApiOkResponse({
    type: AttendanceReportDto,
    description: 'Per-employee attendance summary for the requested month.',
  })
  attendanceReport(@Query() query: QueryReportDto): Promise<AttendanceReportDto> {
    return this.reportsService.attendanceReport(query);
  }
}
