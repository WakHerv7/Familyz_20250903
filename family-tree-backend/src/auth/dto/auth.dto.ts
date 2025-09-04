import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';

export enum RegistrationType {
  CREATE_FAMILY = 'create_family',
  JOIN_FAMILY = 'join_family',
}

export class RegisterDto {
  @ApiProperty({
    description: 'Registration type - create new family or join existing family',
    enum: RegistrationType,
    example: RegistrationType.CREATE_FAMILY,
  })
  @IsEnum(RegistrationType)
  @IsNotEmpty()
  registrationType: RegistrationType;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User phone number (international format)',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Password - Must contain at least 8 characters, one uppercase, one lowercase, one digit, and one special character',
    example: 'SecurePass123!',
    minLength: 8,
    maxLength: 32,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
  })
  password: string;

  // Member information
  @ApiProperty({
    description: 'Full name of the member',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Gender',
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    required: false,
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    description: 'Personal information as JSON object',
    example: { bio: 'Family patriarch', birthDate: '1950-01-01', occupation: 'Engineer' },
    required: false,
  })
  @IsOptional()
  personalInfo?: any;

  // Family information (for CREATE_FAMILY type)
  @ApiProperty({
    description: 'Family name (required for CREATE_FAMILY)',
    example: 'The Smith Family',
    required: false,
  })
  @IsString()
  @IsOptional()
  familyName?: string;

  @ApiProperty({
    description: 'Family description',
    example: 'Our extended family tree',
    required: false,
  })
  @IsString()
  @IsOptional()
  familyDescription?: string;

  // Invitation information (for JOIN_FAMILY type)
  @ApiProperty({
    description: 'Invitation code (required for JOIN_FAMILY)',
    example: 'INV_abcdef123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  invitationCode?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 604800,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email?: string;
    phone?: string;
    member: {
      id: string;
      name: string;
      gender?: string;
    };
  };
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Registration successful',
  })
  message: string;

  @ApiProperty({
    description: 'Authentication tokens and user info',
  })
  data: AuthResponseDto;

  @ApiProperty({
    description: 'Family information (for CREATE_FAMILY)',
    required: false,
  })
  family?: {
    id: string;
    name: string;
    description?: string;
  };
}
