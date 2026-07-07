import { ApiProperty } from '@nestjs/swagger';

/** Serialized employee returned by all employee endpoints. */
export class EmployeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Alice Johnson' })
  name: string;

  @ApiProperty({ example: 30 })
  age: number;

  @ApiProperty({ example: 'Software Engineer' })
  designation: string;

  @ApiProperty({ example: '2021-03-01' })
  hiringDate: string;

  @ApiProperty({ example: '1994-05-12' })
  dateOfBirth: string;

  @ApiProperty({ example: 85000 })
  salary: number;

  @ApiProperty({ nullable: true, description: 'Stored photo filename' })
  photoPath: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Absolute URL to the photo (derived from APP_URL)',
  })
  photoUrl: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
