import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

// Create Invitation DTO
export class CreateInvitationDto {
  @ApiProperty()
  @IsUUID()
  familyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  memberStub?: Record<string, unknown>;
}

// Accept Invitation DTO
export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  invitationCode: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  personalInfo?: Record<string, unknown>;
}

// Response DTOs
export class InvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  familyId: string;

  @ApiProperty()
  familyName: string;

  @ApiPropertyOptional()
  inviterName?: string;

  @ApiPropertyOptional()
  memberStub?: Record<string, unknown>;

  @ApiProperty()
  status: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class InvitationValidationDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  familyName: string;

  @ApiProperty()
  inviterName: string;

  @ApiPropertyOptional()
  memberStub?: Record<string, unknown>;

  @ApiProperty()
  expiresAt: Date;
}
