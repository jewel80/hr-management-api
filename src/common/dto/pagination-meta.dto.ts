import { ApiProperty } from '@nestjs/swagger';

/** Swagger-friendly pagination metadata. Mirrors {@link PaginationMeta}. */
export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page (1-based)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Page size' })
  limit: number;

  @ApiProperty({ example: 42, description: 'Total matching records' })
  total: number;

  @ApiProperty({ example: 5, description: 'Total pages' })
  totalPages: number;
}
