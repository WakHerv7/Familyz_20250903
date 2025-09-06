import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Shield,
  Users,
  Settings,
  FileText,
  MessageSquare,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient as api } from "@/lib/api";

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  permissions: Array<{
    permission: string;
    displayName: string;
    grantedAt: string;
  }>;
  permissionCount: number;
}

interface Permission {
  permission: string;
  displayName: string;
  description: string;
}

interface PermissionManagerProps {
  familyId: string;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ familyId }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null
  );
  const [memberPermissions, setMemberPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [familyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersResponse, permissionsResponse] = await Promise.all([
        api.get(`/families/${familyId}/permissions`),
        api.get("/families/permissions/available"),
      ]);

      setMembers(membersResponse as FamilyMember[]);
      setAvailablePermissions(
        (permissionsResponse as { permissions: Permission[] }).permissions
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load permission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberPermissions = async (
    memberId: string,
    permissions: string[]
  ) => {
    try {
      setUpdating(memberId);
      await api.put(`/families/${familyId}/members/${memberId}/permissions`, {
        permissions,
      });

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });

      // Reload data to reflect changes
      await loadData();
      setSelectedMember(null);
      setMemberPermissions([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const resetMemberPermissions = async (memberId: string) => {
    try {
      setUpdating(memberId);
      await api.post(
        `/families/${familyId}/members/${memberId}/permissions/reset`
      );

      toast({
        title: "Success",
        description: "Permissions reset to role defaults",
      });

      await loadData();
      setSelectedMember(null);
      setMemberPermissions([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset permissions",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const openPermissionEditor = (member: FamilyMember) => {
    setSelectedMember(member);
    setMemberPermissions(member.permissions.map((p) => p.permission));
  };

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setMemberPermissions((prev) => [...prev, permission]);
    } else {
      setMemberPermissions((prev) => prev.filter((p) => p !== permission));
    }
  };

  const savePermissions = () => {
    if (selectedMember) {
      updateMemberPermissions(selectedMember.id, memberPermissions);
    }
  };

  const getPermissionIcon = (permission: string) => {
    if (permission.includes("view")) return <Eye className="w-4 h-4" />;
    if (permission.includes("edit") || permission.includes("manage"))
      return <Settings className="w-4 h-4" />;
    if (permission.includes("export") || permission.includes("upload"))
      return <FileText className="w-4 h-4" />;
    if (permission.includes("message") || permission.includes("post"))
      return <MessageSquare className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "head":
        return "bg-purple-100 text-purple-800";
      case "moderator":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPermissionCategory = (permission: string) => {
    if (permission.includes("view")) return "Viewing";
    if (
      permission.includes("edit") ||
      permission.includes("add") ||
      permission.includes("remove")
    )
      return "Member Management";
    if (permission.includes("manage") && permission.includes("permission"))
      return "Administration";
    if (
      permission.includes("upload") ||
      (permission.includes("manage") && permission.includes("document"))
    )
      return "Content";
    if (permission.includes("export")) return "Content";
    if (
      permission.includes("message") ||
      permission.includes("post") ||
      permission.includes("moderate")
    )
      return "Communication";
    return "Other";
  };

  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    const category = getPermissionCategory(perm.permission);
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Permission Management</h2>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Manage granular permissions for family members. Changes take effect
          immediately.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Family Members</TabsTrigger>
          <TabsTrigger value="permissions">Available Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissionEditor(member)}
                      disabled={updating === member.id}
                    >
                      Edit Permissions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetMemberPermissions(member.id)}
                      disabled={updating === member.id}
                    >
                      {updating === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Current Permissions ({member.permissions.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.permissions.map((perm) => (
                      <Badge
                        key={perm.permission}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {getPermissionIcon(perm.permission)}
                        {perm.displayName}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Available Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission.permission}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getPermissionIcon(permission.permission)}
                      <span className="font-medium">
                        {permission.displayName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {permission.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permission Editor Modal */}
      {selectedMember && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Permissions for {selectedMember.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3">{category}</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.permission}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={permission.permission}
                          checked={memberPermissions.includes(
                            permission.permission
                          )}
                          onCheckedChange={(checked) =>
                            handlePermissionToggle(
                              permission.permission,
                              checked as boolean
                            )
                          }
                        />
                        <label
                          htmlFor={permission.permission}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          {getPermissionIcon(permission.permission)}
                          {permission.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={savePermissions}
                  disabled={updating === selectedMember.id}
                >
                  {updating === selectedMember.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Save Permissions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMember(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionManager;
