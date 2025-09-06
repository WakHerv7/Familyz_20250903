import { PrismaService } from "../prisma/prisma.service";
import { FamilyPermission } from "../auth/permissions.enum";
export declare class FamilyPermissionsService {
    private prisma;
    constructor(prisma: PrismaService);
    getMemberPermissions(familyId: string, memberId: string): Promise<{
        member: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.FamilyRole;
        };
        permissions: {
            permission: string;
            displayName: string;
            description: string;
            grantedBy: string;
            grantedAt: Date;
        }[];
    }>;
    grantPermission(familyId: string, memberId: string, permission: FamilyPermission, grantedBy: string): Promise<{
        message: string;
        permission: {
            permission: string;
            displayName: string;
            grantedBy: string;
            grantedAt: Date;
        };
    }>;
    revokePermission(familyId: string, memberId: string, permission: FamilyPermission): Promise<{
        message: string;
        permission: FamilyPermission;
    }>;
    updateMemberPermissions(familyId: string, memberId: string, permissions: FamilyPermission[], updatedBy: string): Promise<{
        message: string;
        grantedPermissions: number;
    }>;
    getFamilyPermissions(familyId: string): Promise<{
        member: {
            id: string;
            name: string;
            gender: import(".prisma/client").$Enums.Gender;
            role: import(".prisma/client").$Enums.FamilyRole;
        };
        permissions: {
            permission: string;
            displayName: string;
            grantedAt: Date;
        }[];
        permissionCount: number;
    }[]>;
    resetMemberPermissions(familyId: string, memberId: string, resetBy: string): Promise<{
        message: string;
        role: import(".prisma/client").$Enums.FamilyRole;
        grantedPermissions: any;
    }>;
    getAvailablePermissions(): Promise<{
        permissions: {
            permission: FamilyPermission;
            displayName: string;
            description: string;
        }[];
        total: number;
    }>;
}
