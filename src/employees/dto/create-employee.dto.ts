import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Body for `POST /employees` (multipart/form-data). The optional `photo` is a
 * binary file part handled separately by the interceptor, not a JSON property.
 */
export class CreateEmployeeDto {
  @ApiProperty({ example: 'Alice Johnson' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 30, minimum: 18, maximum: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(120)
  age: number;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  designation: string;

  @ApiProperty({ example: '2021-03-01', format: 'date' })
  @IsDateString()
  hiringDate: string;

  @ApiProperty({ example: '1994-05-12', format: 'date' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 85000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary: number;
}
