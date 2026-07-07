import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { AttendanceResponseDto } from './attendance-response.dto';

/** Paginated list result for `GET /attendance`. */
export class PaginatedAttendanceDto {
  @ApiProperty({ type: [AttendanceResponseDto] })
  items: AttendanceResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
