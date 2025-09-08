import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Gender, MemberStatus } from "@prisma/client";

export class ImportMemberDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo?: PersonalInfoDto;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parentNames?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spouseNames?: string[];

  @IsOptional()
  @IsString()
  familyName?: string;

  @IsOptional()
  @IsString()
  familyRole?: string;
}

export class PersonalInfoDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  socialLinks?: Record<string, string>;
}

export class ImportFamilyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportMemberDto)
  members: ImportMemberDto[];
}

export class StartImportDto {
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsString()
  importName?: string;
}

export class ImportProgressDto {
  @IsUUID()
  importId: string;
}

export class ValidateImportDto {
  @IsOptional()
  @IsUUID()
  familyId?: string;
}

export class RollbackImportDto {
  @IsUUID()
  importId: string;
}
