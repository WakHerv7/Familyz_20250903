import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Gender as PrismaGender, MemberStatus as PrismaMemberStatus } from '@prisma/client';

export { PrismaGender as Gender, PrismaMemberStatus as MemberStatus };

export enum TreeFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

// Tree Node for visualization
export class TreeNodeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: PrismaGender })
  gender?: PrismaGender;

  @ApiProperty({ enum: PrismaMemberStatus })
  status: PrismaMemberStatus;

  @ApiPropertyOptional()
  personalInfo?: Record<string, unknown>;

  @ApiProperty()
  level: number;

  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiProperty({ type: [String] })
  parentIds: string[];

  @ApiProperty({ type: [String] })
  childrenIds: string[];

  @ApiProperty({ type: [String] })
  spouseIds: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Connection between nodes
export class TreeConnectionDto {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  type: 'parent' | 'spouse' | 'child';

  @ApiProperty()
  strength: number;
}

// Complete tree data
export class FamilyTreeDto {
  @ApiProperty({ type: [TreeNodeDto] })
  nodes: TreeNodeDto[];

  @ApiProperty({ type: [TreeConnectionDto] })
  connections: TreeConnectionDto[];

  @ApiProperty()
  centerNodeId: string;

  @ApiProperty()
  familyId: string;

  @ApiProperty()
  familyName: string;

  @ApiProperty()
  totalMembers: number;

  @ApiProperty()
  generations: number;
}

// Tree export request
export class ExportTreeDto {
  @ApiProperty()
  @IsUUID()
  familyId: string;

  @ApiProperty({ enum: TreeFormat })
  @IsEnum(TreeFormat)
  format: TreeFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includePersonalInfo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeInactiveMembers?: boolean;
}

// Tree statistics
export class TreeStatisticsDto {
  @ApiProperty()
  totalMembers: number;

  @ApiProperty()
  totalFamilies: number;

  @ApiProperty()
  totalGenerations: number;

  @ApiProperty()
  averageChildrenPerMember: number;

  @ApiProperty()
  oldestMember?: {
    id: string;
    name: string;
    birthYear?: number;
  };

  @ApiProperty()
  youngestMember?: {
    id: string;
    name: string;
    birthYear?: number;
  };

  @ApiProperty()
  genderDistribution: {
    male: number;
    female: number;
    other: number;
    unspecified: number;
  };

  @ApiProperty()
  statusDistribution: {
    active: number;
    inactive: number;
    deceased: number;
    archived: number;
  };
}
