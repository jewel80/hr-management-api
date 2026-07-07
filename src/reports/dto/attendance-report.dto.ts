import { ApiProperty } from '@nestjs/swagger';
import { AttendanceReportItemDto } from './attendance-report-item.dto';

/** Wrapper for the monthly attendance report response. */
export class AttendanceReportDto {
  @ApiProperty({ example: '2026-07', description: 'Reported month (YYYY-MM)' })
  month: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Employee filter applied, if any',
  })
  employeeId: string | null;

  @ApiProperty({ type: [AttendanceReportItemDto] })
  items: AttendanceReportItemDto[];
}
