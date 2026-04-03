// ============================================================
// SRP AI HRMS - Shared Validators
// ============================================================

import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ---- Pagination DTO ----
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

// ---- Tenant-Aware Base DTO ----
export class TenantBaseDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;
}

// ---- Date Range DTO ----
export class DateRangeDto {
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

// ---- ID Param DTO ----
export class IdParamDto {
  @IsUUID()
  id!: string;
}

// ---- Bulk Action DTO ----
export class BulkActionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];
}

// ---- Address DTO ----
export class AddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode!: string;
}

export {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
  Matches,
  Type,
  Transform,
};
