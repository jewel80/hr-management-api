import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID, Matches } from 'class-validator';

/** Body for `POST /attendance` (upsert on `(employeeId, date)`). */
export class CreateAttendanceDto {
  @ApiProperty({ description: 'Existing employee id' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: '2026-07-07', format: 'date' })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: '09:30:00',
    description: 'Check-in time of day; HH:mm or HH:mm:ss',
  })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'checkInTime must be in HH:mm or HH:mm:ss format.',
  })
  checkInTime: string;
}
