import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Plus,
  Save,
  Trash2,
  Copy,
  Users,
  Eye,
  Settings,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient as api } from "@/lib/api";

interface Permission {
  permission: string;
  displayName: string;
  description: string;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

interface PermissionTemplateProps {
  familyId: string;
}

const PermissionTemplate: React.FC<PermissionTemplateProps> = ({
  familyId,
}) => {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PermissionTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [familyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load available permissions
      const permissionsResponse = await api.get(
        "/families/permissions/available"
      );
      setAvailablePermissions(
        (permissionsResponse as { permissions: Permission[] }).permissions
      );

      // Load templates (mock data for now)
      setTemplates([
        {
          id: "1",
          name: "Basic Member",
          description: "Standard permissions for regular family members",
          permissions: [
            "view_tree",
            "view_members",
            "edit_own_profile",
            "send_messages",
            "create_posts",
          ],
          createdBy: "Admin",
          createdAt: new Date().toISOString(),
          usageCount: 8,
        },
        {
          id: "2",
          name: "Content Manager",
          description: "Permissions for managing family content and documents",
          permissions: [
            "view_tree",
            "view_members",
            "edit_own_profile",
            "upload_photos",
            "manage_documents",
            "send_messages",
            "create_posts",
          ],
          createdBy: "Admin",
          createdAt: new Date().toISOString(),
          usageCount: 3,
        },
        {
          id: "3",
          name: "Viewer Only",
          description: "Read-only access to family information",
          permissions: ["view_tree", "view_members", "view_family_info"],
          createdBy: "Admin",
          createdAt: new Date().toISOString(),
          usageCount: 2,
        },
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load template data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      // In a real implementation, this would call the API
      const template: PermissionTemplate = {
        id: Date.now().toString(),
        name: newTemplate.name,
        description: newTemplate.description,
        permissions: newTemplate.permissions,
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };

      setTemplates((prev) => [...prev, template]);
      setNewTemplate({ name: "", description: "", permissions: [] });

      toast({
        title: "Success",
        description: "Permission template created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const applyTemplate = async (
    template: PermissionTemplate,
    memberId: string
  ) => {
    try {
      await api.put(`/families/${familyId}/members/${memberId}/permissions`, {
        permissions: template.permissions,
      });

      toast({
        title: "Success",
        description: `Applied ${template.name} template to member`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Permission Templates</h2>
        </div>
        <Button
          onClick={() => setSelectedTemplate(null)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Create and manage permission templates for quick assignment to family
          members.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Templates List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Templates</h3>
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Permissions ({template.permissions.length})
                    </span>
                    <Badge variant="secondary">
                      Used {template.usageCount} times
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {template.permissions.map((perm) => {
                      const permData = availablePermissions.find(
                        (p) => p.permission === perm
                      );
                      return (
                        <Badge
                          key={perm}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {getPermissionIcon(perm)}
                          {permData?.displayName || perm}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created by {template.createdBy} on{" "}
                    {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No templates created yet
            </div>
          )}
        </div>

        {/* Template Editor */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {selectedTemplate ? "Edit Template" : "Create New Template"}
          </h3>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={
                      selectedTemplate
                        ? selectedTemplate.name
                        : newTemplate.name
                    }
                    onChange={(e) => {
                      if (selectedTemplate) {
                        setSelectedTemplate((prev) =>
                          prev ? { ...prev, name: e.target.value } : null
                        );
                      } else {
                        setNewTemplate((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                      }
                    }}
                    placeholder="Enter template name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={
                      selectedTemplate
                        ? selectedTemplate.description
                        : newTemplate.description
                    }
                    onChange={(e) => {
                      if (selectedTemplate) {
                        setSelectedTemplate((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        );
                      } else {
                        setNewTemplate((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                      }
                    }}
                    placeholder="Enter template description"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  {Object.entries(groupedPermissions).map(
                    ([category, perms]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm mb-2">{category}</h4>
                        <div className="grid gap-2">
                          {perms.map((permission) => {
                            const currentPermissions = selectedTemplate
                              ? selectedTemplate.permissions
                              : newTemplate.permissions;
                            const isChecked = currentPermissions.includes(
                              permission.permission
                            );

                            return (
                              <div
                                key={permission.permission}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={permission.permission}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (selectedTemplate) {
                                      setSelectedTemplate((prev) => {
                                        if (!prev) return null;
                                        const newPerms = checked
                                          ? [
                                              ...prev.permissions,
                                              permission.permission,
                                            ]
                                          : prev.permissions.filter(
                                              (p) => p !== permission.permission
                                            );
                                        return {
                                          ...prev,
                                          permissions: newPerms,
                                        };
                                      });
                                    } else {
                                      setNewTemplate((prev) => ({
                                        ...prev,
                                        permissions: checked
                                          ? [
                                              ...prev.permissions,
                                              permission.permission,
                                            ]
                                          : prev.permissions.filter(
                                              (p) => p !== permission.permission
                                            ),
                                      }));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={permission.permission}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                >
                                  {getPermissionIcon(permission.permission)}
                                  {permission.displayName}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={
                      selectedTemplate
                        ? () => setSelectedTemplate(null)
                        : createTemplate
                    }
                    disabled={creating}
                  >
                    {creating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    {selectedTemplate ? "Update Template" : "Create Template"}
                  </Button>
                  {selectedTemplate && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PermissionTemplate;
