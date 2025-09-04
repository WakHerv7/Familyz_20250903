import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FamilyRole as PrismaFamilyRole } from '@prisma/client';

export { PrismaFamilyRole as FamilyRole };

// Create Family DTO
export class CreateFamilyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSubFamily?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentFamilyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  headOfFamilyId?: string;
}

// Update Family DTO
export class UpdateFamilyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  headOfFamilyId?: string;
}

// Family Membership DTO
export class UpdateFamilyMembershipDto {
  @ApiProperty({ enum: PrismaFamilyRole })
  @IsEnum(PrismaFamilyRole)
  role: PrismaFamilyRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  manuallyEdited?: boolean;
}

// Add Member to Family DTO
export class AddMemberToFamilyDto {
  @ApiProperty()
  @IsUUID()
  memberId: string;

  @ApiProperty({ enum: PrismaFamilyRole })
  @IsEnum(PrismaFamilyRole)
  role: PrismaFamilyRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

// Response DTOs
export class FamilyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isSubFamily: boolean;

  @ApiProperty()
  creatorId: string;

  @ApiPropertyOptional()
  headOfFamilyId?: string;

  @ApiPropertyOptional()
  parentFamilyId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FamilyMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: PrismaFamilyRole;

  @ApiProperty()
  type: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  joinDate: Date;
}

export class FamilyWithMembersDto extends FamilyResponseDto {
  @ApiProperty({ type: [FamilyMemberDto] })
  members: FamilyMemberDto[];

  @ApiProperty({ type: [FamilyResponseDto] })
  subFamilies: FamilyResponseDto[];
}
