import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { EmployeeResponseDto } from './employee-response.dto';

/** Paginated list result for `GET /employees`. */
export class PaginatedEmployeesDto {
  @ApiProperty({ type: [EmployeeResponseDto] })
  items: EmployeeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
