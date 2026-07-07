import { ApiProperty } from '@nestjs/swagger';

/** Per-employee attendance summary for the monthly report. */
export class AttendanceReportItemDto {
  @ApiProperty({ description: 'Employee id' })
  employeeId: string;

  @ApiProperty({ example: 'Alice Johnson' })
  name: string;

  @ApiProperty({
    example: 18,
    description: 'Number of distinct days with a check-in',
  })
  daysPresent: number;

  @ApiProperty({
    example: 4,
    description: 'Days where check_in_time is after 09:45:00',
  })
  timesLate: number;
}
