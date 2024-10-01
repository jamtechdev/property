// pagination.dto.ts
import { IsInt, Min, IsOptional } from 'class-validator';

export class PaginationDto {
  page?: any;
  limit?: any;
}
