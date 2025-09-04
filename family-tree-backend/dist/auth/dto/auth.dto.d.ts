export declare enum RegistrationType {
    CREATE_FAMILY = "create_family",
    JOIN_FAMILY = "join_family"
}
export declare class RegisterDto {
    registrationType: RegistrationType;
    email?: string;
    phone?: string;
    password: string;
    name: string;
    gender?: string;
    personalInfo?: any;
    familyName?: string;
    familyDescription?: string;
    invitationCode?: string;
}
export declare class LoginDto {
    emailOrPhone: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
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
export declare class RegisterResponseDto {
    success: boolean;
    message: string;
    data: AuthResponseDto;
    family?: {
        id: string;
        name: string;
        description?: string;
    };
}
