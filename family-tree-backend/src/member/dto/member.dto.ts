import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsUUID,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  Gender as PrismaGender,
  MemberStatus as PrismaMemberStatus,
  FamilyRole as PrismaFamilyRole,
} from "@prisma/client";

// Use Prisma enums directly
export {
  PrismaGender as Gender,
  PrismaMemberStatus as MemberStatus,
  PrismaFamilyRole as FamilyRole,
};

export enum RelationshipType {
  PARENT = "PARENT",
  SPOUSE = "SPOUSE",
  CHILD = "CHILD",
}

// Update Member Profile DTO
export class UpdateMemberProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: PrismaGender })
  @IsOptional()
  @IsEnum(PrismaGender)
  gender?: PrismaGender;

  @ApiPropertyOptional({ enum: PrismaMemberStatus })
  @IsOptional()
  @IsEnum(PrismaMemberStatus)
  status?: PrismaMemberStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  personalInfo?: any;
}

// Add Relationship DTO
export class AddRelationshipDto {
  @ApiProperty()
  @IsUUID()
  relatedMemberId: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @ApiProperty()
  @IsUUID()
  familyId: string;
}

// Remove Relationship DTO
export class RemoveRelationshipDto {
  @ApiProperty()
  @IsUUID()
  relatedMemberId: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @ApiProperty()
  @IsUUID()
  familyId: string;
}

// Bulk Relationship DTO
export class BulkRelationshipDto {
  @ApiProperty({ type: [AddRelationshipDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddRelationshipDto)
  relationships: AddRelationshipDto[];
}

// Create Member DTO
export class CreateMemberDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: PrismaGender })
  @IsOptional()
  @IsEnum(PrismaGender)
  gender?: PrismaGender;

  @ApiPropertyOptional({ enum: PrismaMemberStatus })
  @IsOptional()
  @IsEnum(PrismaMemberStatus)
  status?: PrismaMemberStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  personalInfo?: any;

  @ApiProperty()
  @IsUUID()
  familyId: string;

  @ApiPropertyOptional({ enum: PrismaFamilyRole })
  @IsOptional()
  @IsEnum(PrismaFamilyRole)
  role?: PrismaFamilyRole;

  @ApiPropertyOptional({ type: [AddRelationshipDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddRelationshipDto)
  initialRelationships?: AddRelationshipDto[];
}

// Response DTOs
export class FamilyMembershipDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  familyId: string;

  @ApiProperty()
  familyName: string;

  @ApiProperty({ enum: PrismaFamilyRole })
  role: PrismaFamilyRole;

  @ApiProperty()
  type: string;

  @ApiProperty()
  autoEnrolled: boolean;

  @ApiProperty()
  manuallyEdited: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  joinDate: Date;
}

export class MemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ enum: PrismaGender })
  gender?: PrismaGender;

  @ApiProperty({ enum: PrismaMemberStatus })
  status: PrismaMemberStatus;

  @ApiPropertyOptional()
  personalInfo?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [FamilyMembershipDto] })
  familyMemberships?: FamilyMembershipDto[];
}

// Simple member for relationships (less data)
export class SimpleMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  gender?: PrismaGender;
}

export class MemberRelationshipsResponseDto extends MemberResponseDto {
  @ApiProperty({ type: [SimpleMemberDto] })
  parents: SimpleMemberDto[];

  @ApiProperty({ type: [SimpleMemberDto] })
  children: SimpleMemberDto[];

  @ApiProperty({ type: [SimpleMemberDto] })
  spouses: SimpleMemberDto[];

  @ApiProperty({ type: [FamilyMembershipDto] })
  familyMemberships: FamilyMembershipDto[];
}
