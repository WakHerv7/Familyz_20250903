"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api";
import { useUpdateProfile, useFamilies, useFamilyMembers } from "@/hooks/api";
import { useAppSelector } from "@/hooks/redux";
import {
  MemberWithRelationships,
  Gender,
  MemberStatus,
  UpdateMemberRequest,
  Member,
  RelationshipType,
} from "@/types";
import { updateProfileSchema } from "@/schemas/member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Folder,
  ChevronDown,
  ChevronRight,
  Users,
  Plus,
  UserPlus,
  Heart,
  User,
  MoreVertical,
  Eye,
  Edit,
  MoreHorizontal,
  Download,
  FileText,
  Trash2,
  FolderTree,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddFamilyMemberDialog from "@/components/dialogs/AddFamilyMemberDialog";
import ViewMemberDialog from "@/components/dialogs/ViewMemberDialog";
import { CustomDialog } from "@/components/ui/custom-dialog";
import {
  CustomDialogContent,
  CustomDialogDescription,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogClose,
} from "@/components/ui/custom-dialog";
import { ClipLoader } from "react-spinners";
import ReactSelect from "react-select";
import { useFamilyTree } from "@/hooks/api";

interface TreeNode {
  id: string;
  name: string;
  gender?: string;
  status: string;
  level: number;
  x: number;
  y: number;
  parentIds: string[];
  childrenIds: string[];
  spouseIds: string[];
  personalInfo?: any;
  children: TreeNode[];
  expanded: boolean;
  hasChildren: boolean;
}

interface FamilyFolderTreeViewProps {
  familyId: string;
  profile: any;
  onMemberClick?: (memberId: string) => void;
}

interface RelationshipEntry {
  relatedMemberId: string;
  relatedMemberName: string;
  relationshipType: RelationshipType;
}

export default function FamilyFolderTreeView({
  familyId,
  profile,
  onMemberClick,
}: FamilyFolderTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addRelationshipType, setAddRelationshipType] = useState<
    "parent" | "spouse" | "child" | null
  >(null);
  const [selectedMemberForRelationship, setSelectedMemberForRelationship] =
    useState<{
      id: string;
      name: string;
    } | null>(null);
  const [dropdownKey, setDropdownKey] = useState(0); // Force re-render key

  // Fetch family-specific folder tree data using the new export service
  const {
    data: folderTreeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["family-folder-tree", familyId],
    queryFn: async () => {
      if (!familyId) return null;
      const response = await apiClient.get<
        Array<{
          column: number;
          value: string;
          memberIds: { id: string; name: string; gender: string }[];
        }>
      >(`/export/family-folder-tree-data?familyId=${familyId}`);
      return response;
    },
    enabled: !!familyId,
  });

  // Check if user is admin of this family
  const isAdmin =
    profile?.familyMemberships?.find(
      (membership: any) => membership.familyId === familyId
    )?.role === "ADMIN";

  // Build hierarchical tree structure from the folder tree data
  const treeStructure = useMemo(() => {
    if (!folderTreeData || folderTreeData.length === 0) return [];

    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Process each entry from the folder tree data
    folderTreeData.forEach((entry) => {
      entry.memberIds.forEach((member) => {
        if (!nodeMap.has(member.id)) {
          const node: TreeNode = {
            id: member.id,
            name: member.name,
            gender: member.gender,
            status: "ACTIVE", // Default status
            level: entry.column,
            x: 0,
            y: 0,
            parentIds: [],
            childrenIds: [],
            spouseIds: [],
            personalInfo: undefined,
            children: [],
            expanded: false,
            hasChildren: false,
          };
          nodeMap.set(member.id, node);
        }
      });
    });

    // Build parent-child relationships based on column levels
    const entriesByColumn = new Map<number, typeof folderTreeData>();
    folderTreeData.forEach((entry) => {
      if (!entriesByColumn.has(entry.column)) {
        entriesByColumn.set(entry.column, []);
      }
      entriesByColumn.get(entry.column)!.push(entry);
    });

    // For each column, find parent-child relationships
    entriesByColumn.forEach((entries, column) => {
      const nextColumn = column + 1;
      const childEntries = entriesByColumn.get(nextColumn);

      if (childEntries) {
        entries.forEach((parentEntry) => {
          const parentNode = nodeMap.get(parentEntry.memberIds[0]?.id);
          if (parentNode) {
            parentNode.hasChildren = true;

            childEntries.forEach((childEntry) => {
              childEntry.memberIds.forEach((childMember) => {
                const childNode = nodeMap.get(childMember.id);
                if (
                  childNode &&
                  !parentNode.childrenIds.includes(childMember.id)
                ) {
                  parentNode.childrenIds.push(childMember.id);
                  parentNode.children.push(childNode);
                  childNode.parentIds.push(parentNode.id);
                }
              });
            });
          }
        });
      }
    });

    // Find root nodes (those with no parents)
    nodeMap.forEach((node) => {
      if (node.parentIds.length === 0) {
        rootNodes.push(node);
      }
    });

    // Sort root nodes by name
    rootNodes.sort((a, b) => a.name.localeCompare(b.name));

    return rootNodes;
  }, [folderTreeData]);

  // Set initial expanded nodes when tree data changes
  useEffect(() => {
    if (folderTreeData && folderTreeData.length > 0) {
      const initialExpanded = new Set<string>();
      // Expand nodes that have children by default
      treeStructure.forEach((node) => {
        if (node.hasChildren) {
          initialExpanded.add(node.id);
        }
      });
      setExpandedNodes(initialExpanded);
    }
  }, [folderTreeData, treeStructure]);

  // Update tree structure with current expanded state
  const treeStructureWithExpansion = useMemo(() => {
    return treeStructure.map((node) => ({
      ...node,
      expanded: expandedNodes.has(node.id),
      children: node.children.map((child) => ({
        ...child,
        expanded: expandedNodes.has(child.id),
      })),
    }));
  }, [treeStructure, expandedNodes]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleAllNodes = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.hasChildren) {
          allNodeIds.add(node.id);
        }
        collectNodeIds(node.children);
      });
    };
    collectNodeIds(treeStructure);

    // Check if all nodes are currently expanded
    const allExpanded = Array.from(allNodeIds).every((id) =>
      expandedNodes.has(id)
    );

    if (allExpanded) {
      // Collapse all
      setExpandedNodes(new Set());
    } else {
      // Expand all
      setExpandedNodes(allNodeIds);
    }
  };

  const handleAddRelationship = (
    relationshipType: "parent" | "spouse" | "child",
    memberInfo: { id: string; name: string }
  ) => {
    setAddRelationshipType(relationshipType);
    setSelectedMemberForRelationship(memberInfo);
    setShowAddDialog(true);
  };

  const handleViewInfo = (node: TreeNode) => {
    setSelectedMemberId(node.id);
    setShowViewDialog(true);
    onMemberClick?.(node.id);
  };

  const handleEditInfo = (node: TreeNode) => {
    setSelectedMemberId(node.id);
    setShowEditDialog(true);
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      const exportRequest = {
        format,
        scope: "family",
        familyId,
        config: {
          formats: [format],
          familyTree: {
            structure: "textTree",
            includeMembersList: true,
            memberDetails: ["parent", "children", "spouses", "personalInfo"],
          },
        },
        includeData: {
          personalInfo: true,
          relationships: true,
          contactInfo: true,
          profileImages: false,
        },
      };

      const response = (await apiClient.post(
        "/export/family-data",
        exportRequest
      )) as { downloadUrl: string; filename: string };

      if (response.downloadUrl) {
        window.open(response.downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const renderTreeNode = (node: TreeNode, depth = 0): React.ReactNode => {
    const indentLevel = depth * 20;

    return (
      <div key={node.id}>
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-100 rounded transition-colors select-none"
          style={{ marginLeft: `${indentLevel}px` }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 mr-1"
            onClick={() => node.hasChildren && toggleNode(node.id)}
            disabled={!node.hasChildren}
          >
            {node.hasChildren ? (
              <Badge
                variant="outline"
                className="mx-2 text-xs"
                style={{
                  backgroundColor: "#dcfedb77",
                  borderColor: "#179922aa",
                }}
              >
                {node.expanded ? (
                  <ChevronDown className="h-3 w-3 text-green-600" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-green-600" />
                )}
              </Badge>
            ) : null}
          </Button>

          <div className="w-4 h-4 ml-3 mr-2 flex items-center justify-center">
            {node.hasChildren ? (
              <Users className="h-4 w-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs text-blue-600">●</span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span
                className={`text-sm font-mono cursor-pointer transition-colors ${
                  node.gender === "MALE"
                    ? "hover:bg-blue-100 hover:text-blue-800"
                    : node.gender === "FEMALE"
                    ? "hover:bg-rose-100 hover:text-rose-800"
                    : "hover:bg-gray-100"
                } px-2 py-1 rounded`}
              >
                {node.name}
                {node.gender === "MALE" && " ♂"}
                {node.gender === "FEMALE" && " ♀"}
                {node.spouseIds.length > 0 && " ⚭"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 z-50"
              sideOffset={4}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewInfo(node);
                }}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                View infos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditInfo(node);
                }}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit infos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddRelationship("parent", {
                    id: node.id,
                    name: node.name,
                  });
                }}
                className="cursor-pointer"
              >
                <User className="h-4 w-4 mr-2" />
                Add a parent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddRelationship("spouse", {
                    id: node.id,
                    name: node.name,
                  });
                }}
                className="cursor-pointer"
              >
                <Heart className="h-4 w-4 mr-2" />
                Add a spouse
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddRelationship("child", {
                    id: node.id,
                    name: node.name,
                  });
                }}
                className="cursor-pointer"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add a child
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge variant="outline" className="ml-2 text-xs">
            Gen {node.level}
          </Badge>
        </div>

        {node.hasChildren && node.expanded && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const memberCount = folderTreeData?.length || 0;

  return (
    <Card className="w-full" key={`family-tree-container-${dropdownKey}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FolderTree className="h-5 w-5 text-green-600" />
              <span>Family Folder Tree View</span>
              <Badge variant="outline">Interactive</Badge>
              <Badge variant="outline">{memberCount} members</Badge>
              {isAdmin && <Badge variant="outline">Admin View</Badge>}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Traditional hierarchical tree structure with expandable folders
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllNodes}
              className="text-xs"
            >
              {(() => {
                const allNodeIds = new Set<string>();
                const collectNodeIds = (nodes: TreeNode[]) => {
                  nodes.forEach((node) => {
                    if (node.hasChildren) {
                      allNodeIds.add(node.id);
                    }
                    collectNodeIds(node.children);
                  });
                };
                collectNodeIds(treeStructure);
                const allExpanded = Array.from(allNodeIds).every((id) =>
                  expandedNodes.has(id)
                );
                return allExpanded ? "Collapse All" : "Expand All";
              })()}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              className="text-xs hover:text-red-700 hover:bg-red-100"
            >
              <FileText className="h-3 w-3 mr-1" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              className="text-xs hover:text-green-700 hover:bg-green-100"
            >
              <FileText className="h-3 w-3 mr-1" />
              Export Excel
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[3000px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p>Loading family tree...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Failed to load family tree</p>
              <p className="text-sm text-gray-500 mt-1">
                {error.message || "Please try again later"}
              </p>
            </div>
          ) : treeStructureWithExpansion.length > 0 ? (
            treeStructureWithExpansion.map((node) => renderTreeNode(node))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No family data available</p>
              <p className="text-sm">
                Add family members to see the tree structure
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          <p>
            <strong>Family Tree Structure:</strong>
          </p>
          <div className="flex flex-wrap gap-4 mt-1">
            <span>Click expand buttons to show/hide branches</span>
            <span>Action buttons appear for individual members</span>
            <span>⚭ Marriage symbol</span>
            <span>♂ Male / ♀ Female gender symbols</span>
            <span>[Generation X] labels</span>
          </div>
        </div>
      </CardContent>

      {/* Add Family Member Dialog */}
      <AddFamilyMemberDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setAddRelationshipType(null);
            setSelectedMemberForRelationship(null);
          }
        }}
      />

      {/* View Member Dialog */}
      <ViewMemberDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        memberId={selectedMemberId || undefined}
      />

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        memberId={selectedMemberId || undefined}
      />
    </Card>
  );
}

// Edit Member Dialog Component (simplified version)
function EditMemberDialog({
  open,
  onOpenChange,
  memberId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
}) {
  const { data: member, isLoading } = useQuery({
    queryKey: ["member", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const response = await apiClient.get<MemberWithRelationships>(
        `/members/${memberId}`
      );
      return response;
    },
    enabled: open && !!memberId,
  });

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <CustomDialog open={open} onOpenChange={handleClose}>
      <CustomDialogContent className="sm:max-w-[600px]">
        <CustomDialogHeader>
          <CustomDialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Edit Family Member</span>
          </CustomDialogTitle>
          <CustomDialogDescription>
            Member editing functionality would be implemented here.
          </CustomDialogDescription>
          <CustomDialogClose onClick={handleClose} />
        </CustomDialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        ) : member ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-gray-600">
                Edit functionality for {member.name} would be implemented here.
              </p>
              <Button onClick={handleClose} className="mt-4" variant="outline">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Member not found or unable to load member information.</p>
          </div>
        )}
      </CustomDialogContent>
    </CustomDialog>
  );
}
