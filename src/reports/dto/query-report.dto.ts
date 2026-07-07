import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

/** Query parameters for `GET /reports/attendance`. */
export class QueryReportDto {
  @ApiProperty({ example: '2026-07', description: 'Report month in YYYY-MM' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format (e.g. 2026-07).',
  })
  month: string;

  @ApiPropertyOptional({ description: 'Restrict the report to one employee' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;
}
