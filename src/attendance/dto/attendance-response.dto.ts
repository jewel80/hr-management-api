import { ApiProperty } from '@nestjs/swagger';

/** Serialized attendance record returned by attendance endpoints. */
export class AttendanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Employee id' })
  employeeId: string;

  @ApiProperty({ example: '2026-07-07', format: 'date' })
  date: string;

  @ApiProperty({ example: '09:30:00', description: 'Check-in time (HH:mm:ss)' })
  checkInTime: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
