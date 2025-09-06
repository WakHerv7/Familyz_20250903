import { FamilyPermission } from "../auth/permissions.enum";
import { FamilyPermissionsService } from "./family-permissions.service";
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        memberId: string;
    };
}
export declare class FamilyPermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: FamilyPermissionsService);
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
    grantPermission(familyId: string, memberId: string, body: {
        permission: FamilyPermission;
    }, req: AuthenticatedRequest): Promise<{
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
    updateMemberPermissions(familyId: string, memberId: string, body: {
        permissions: FamilyPermission[];
    }, req: AuthenticatedRequest): Promise<{
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
    resetMemberPermissions(familyId: string, memberId: string, req: AuthenticatedRequest): Promise<{
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
export {};
