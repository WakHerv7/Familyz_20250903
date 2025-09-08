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

interface TreeEntry {
  column: number;
  value: string;
  memberIds: {
    id: string;
    name: string;
    gender: string;
    color: string;
    parentColors: string[];
  }[];
}

interface TreeNode {
  id: string;
  value: string;
  column: number;
  memberIds: {
    id: string;
    name: string;
    gender: string;
    color: string;
    parentColors: string[];
  }[];
  children: TreeNode[];
  expanded: boolean;
  hasChildren: boolean;
}

interface FolderTreeViewProps {
  // currentMember: MemberWithRelationships;
  isAdmin?: boolean;
  onMemberClick?: (memberId: string) => void;
  familyId?: string;
}

interface RelationshipEntry {
  relatedMemberId: string;
  relatedMemberName: string;
  relationshipType: RelationshipType;
}

export function getGenderSymbol(gender: string): string {
  switch (gender?.toUpperCase()) {
    case "MALE":
      return "♂";
    case "FEMALE":
      return "♀";
    default:
      return "⚲"; // Gender-neutral symbol
  }
}

// Enhanced Color System for Multiple Spouses
function parseColorInfo(displayName: string): {
  colors: string[];
  cleanName: string;
  hasColors: boolean;
} {
  // Pattern: ●#color ○#parent1 ○#parent2 Name
  const colorPattern = /●(#[\w]+)|○(#[\w]+)/g;
  const colors: string[] = [];
  let match;

  while ((match = colorPattern.exec(displayName)) !== null) {
    colors.push(match[1] || match[2]);
  }

  // Remove color codes from display name
  const cleanName = displayName.replace(/●#[\w]+\s*|○#[\w]+\s*/g, "").trim();

  return {
    colors,
    cleanName,
    hasColors: colors.length > 0,
  };
}

function getMemberColors(memberName: string): {
  mainColor: string;
  parentColors: string[];
  hasColors: boolean;
} {
  const { colors, hasColors } = parseColorInfo(memberName);
  return {
    mainColor: colors[0] || "#6B7280", // Default gray
    parentColors: colors.slice(1, 3), // Up to 2 parent colors
    hasColors,
  };
}

// Color blending utility for multiple spouses
function blendColors(colors: string[]): string {
  if (colors.length === 0) return "#6B7280";
  if (colors.length === 1) return colors[0];

  // Simple color averaging for blending
  const rgbColors = colors.map((color) => {
    const hex = color.replace("#", "");
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
    };
  });

  const avgColor = {
    r: Math.round(
      rgbColors.reduce((sum, c) => sum + c.r, 0) / rgbColors.length
    ),
    g: Math.round(
      rgbColors.reduce((sum, c) => sum + c.g, 0) / rgbColors.length
    ),
    b: Math.round(
      rgbColors.reduce((sum, c) => sum + c.b, 0) / rgbColors.length
    ),
  };

  return `#${avgColor.r.toString(16).padStart(2, "0")}${avgColor.g
    .toString(16)
    .padStart(2, "0")}${avgColor.b.toString(16).padStart(2, "0")}`;
}

export default function FolderTreeView({
  // currentMember,
  isAdmin = false,
  onMemberClick,
  familyId,
}: FolderTreeViewProps) {
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
  const [preSelectedRelationship, setPreSelectedRelationship] = useState<{
    type: "parent" | "spouse" | "child";
    member: {
      id: string;
      name: string;
    };
  } | null>(null);
  const [dropdownKey, setDropdownKey] = useState(0); // Force re-render key

  // Direct color extraction from member data
  const getMemberColor = (memberId: string): string => {
    if (!folderTreeData) return "#6B7280";

    for (const entry of folderTreeData) {
      const member = entry.memberIds.find((m) => m.id === memberId);
      if (member && member.color) {
        return member.color;
      }
    }
    return "#6B7280";
  };

  const getMemberParent1Color = (memberId: string): string => {
    if (!folderTreeData) return "#9CA3AF";

    for (const entry of folderTreeData) {
      const member = entry.memberIds.find((m) => m.id === memberId);
      if (member && member.parentColors && member.parentColors.length > 0) {
        return member.parentColors[0];
      }
    }
    return ""; //"#9CA3AF";
  };

  const getMemberParent2Color = (memberId: string): string => {
    if (!folderTreeData) return "#D1D5DB";

    for (const entry of folderTreeData) {
      const member = entry.memberIds.find((m) => m.id === memberId);
      if (member && member.parentColors && member.parentColors.length > 1) {
        return member.parentColors[1];
      }
    }
    return ""; //  "#D1D5DB";
  };

  // Fetch folder tree data with member IDs for the FolderTreeView
  // const { data: treeData = [], isLoading } = useQuery({
  //   queryKey: familyId
  //     ? ["folder-tree-data-with-ids", familyId]
  //     : ["folder-tree-data-with-ids"],
  //   queryFn: async () => {
  //     if (familyId) {
  //       // Use family-specific endpoint if familyId is provided
  //       const response = await apiClient.get<TreeEntry[]>(
  //         `/export/folder-tree-data-with-ids?familyId=${familyId}`
  //       );
  //       return response;
  //     } else {
  //       // Use global endpoint as fallback
  //       const response = await apiClient.get<TreeEntry[]>(
  //         "/export/folder-tree-data-with-ids"
  //       );
  //       return response;
  //     }
  //   },
  // });
  const {
    data: folderTreeData = [],
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
          memberIds: {
            id: string;
            name: string;
            gender: string;
            color: string;
            parentColors: string[];
          }[];
        }>
      >(`/export/family-folder-tree-data?familyId=${familyId}`);
      return response;
    },
    enabled: !!familyId,
  });

  // Compute initial expanded nodes from treeData
  const initialExpanded = useMemo(() => {
    if (!folderTreeData?.length) return new Set<string>();

    const computeExpandable = (
      entries: TreeEntry[],
      startIndex: number = 0
    ): Set<string> => {
      const result = new Set<string>();
      let i = startIndex;

      while (i < entries.length) {
        const entry = entries[i];
        const stableId = `${entry.column}-${entry.value.replace(
          /[^a-zA-Z0-9]/g,
          ""
        )}-${i}`;
        // Check if has children
        const childrenStart = i + 1;
        let childrenEnd = childrenStart;
        while (
          childrenEnd < entries.length &&
          entries[childrenEnd].column > entry.column
        ) {
          childrenEnd++;
        }
        if (childrenEnd > childrenStart) {
          result.add(stableId);
          // Recursively add children's expandable IDs
          const childExpandables = computeExpandable(
            entries.slice(childrenStart, childrenEnd),
            0
          );
          childExpandables.forEach((id) => result.add(id));
          i = childrenEnd - 1; // Skip processed children
        }
        i++;
      }
      return result;
    };

    return computeExpandable(folderTreeData);
  }, [folderTreeData]);

  // Set expanded nodes to initial expanded when treeData changes
  useEffect(() => {
    setExpandedNodes(initialExpanded);
  }, [initialExpanded]);

  // Build hierarchical tree structure from flat data
  const treeStructure = useMemo(() => {
    if (!folderTreeData?.length) return [];

    const buildTree = (
      entries: TreeEntry[],
      startIndex: number = 0,
      parentPath: string = ""
    ): TreeNode[] => {
      const result: TreeNode[] = [];
      let i = startIndex;

      while (i < entries.length) {
        const entry = entries[i];
        // Create stable ID based on content and position
        const stableId = `${entry.column}-${entry.value.replace(
          /[^a-zA-Z0-9]/g,
          ""
        )}-${i}`;
        const node: TreeNode = {
          id: stableId,
          value: entry.value,
          column: entry.column,
          children: [],
          memberIds: entry.memberIds,
          expanded: expandedNodes.has(stableId),
          hasChildren: false,
        };

        // Check if next entries are children (higher column number)
        const childrenStart = i + 1;
        let childrenEnd = childrenStart;

        while (
          childrenEnd < entries.length &&
          entries[childrenEnd].column > entry.column
        ) {
          childrenEnd++;
        }

        if (childrenEnd > childrenStart) {
          node.children = buildTree(
            entries.slice(childrenStart, childrenEnd),
            0,
            stableId
          );
          node.hasChildren = node.children.length > 0;
          i = childrenEnd - 1; // Skip processed children
        }

        result.push(node);
        i++;
      }

      return result;
    };

    console.log("treeData :: ", folderTreeData);
    console.log("expandedNodes :: ", expandedNodes);

    return buildTree(folderTreeData);
  }, [folderTreeData, expandedNodes]);

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
    setPreSelectedRelationship({
      type: relationshipType,
      member: memberInfo,
    });
    setShowAddDialog(true);
  };

  const handleViewInfo = (node: TreeNode, memberId: string) => {
    // Find the corresponding tree entry to get the memberIds
    const treeEntry = folderTreeData?.find((entry, index) => {
      const stableId = `${entry.column}-${entry.value.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}-${index}`;
      return stableId === node.id;
    });

    const memberIds = node?.memberIds;
    const member: any = memberIds.find((m) => m.id === memberId);
    setSelectedMemberId(memberId);
    setShowViewDialog(true);
    console.log("View info for:", member?.name || node.value, "ID:", memberId);
  };

  const handleEditInfo = (node: TreeNode, memberId: string) => {
    // Find the corresponding tree entry to get the memberIds
    const treeEntry = folderTreeData?.find((entry, index) => {
      const stableId = `${entry.column}-${entry.value.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}-${index}`;
      return stableId === node.id;
    });

    const memberIds = node?.memberIds;
    const member: any = memberIds.find((m) => m.id === memberId);
    setSelectedMemberId(memberId);
    setShowEditDialog(true);
    console.log("View info for:", member?.name || node.value, "ID:", memberId);
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      const exportRequest = {
        format,
        scope: "all-families",
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
        // Open download in new tab
        window.open(response.downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Export failed:", error);
      // You could add a toast notification here
    }
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const indentLevel = node.column * 20;
    const isLeafNode = !node.hasChildren;

    const assembleValue = (
      memberIds: {
        id: string;
        name: string;
        gender: string;
        color: string;
        parentColors: string[];
      }[]
    ) => {
      const result: (
        | { type: "text"; content: string }
        | { id: string; type: "name"; name: string; gender: string }
      )[] = [];

      // Create a map of names to their genders
      const nameToGender = new Map<string, string>();
      memberIds?.forEach((member, index) => {
        const name = member.name;
        const gender = member.gender;
        if (index === 0) {
          result.push({
            id: member.id,
            type: "name",
            name: `${name} ${getGenderSymbol(gender)}`,
            gender,
          });
        } else {
          result.push({ type: "text", content: `↔` }); // ↔ / ● /  ♂ / ⚭ / ♀ / ⚲
          result.push({
            id: member.id,
            type: "name",
            name: `${name} ${getGenderSymbol(gender)}`,
            gender,
          });
        }
      });
      return result;
    };

    const valueParts = assembleValue(node.memberIds);

    return (
      <div key={node.id}>
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-100 rounded transition-colors select-none"
          style={{ marginLeft: `${indentLevel}px` }}
        >
          {/* Expand/Collapse Button */}
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

          {/* Node Icon */}
          <div className="w-4 h-4 ml-3 mr-2 flex items-center justify-center">
            {node.hasChildren ? (
              <Users className="h-4 w-4 text-green-600" />
            ) : node.value ? (
              <></>
            ) : (
              // <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
              //   <span className="text-xs text-blue-600">●</span>
              // </div>
              <></>
            )}
          </div>

          {/* Render decomposed parts */}
          {valueParts.map((part, index) => {
            if (part.type === "text") {
              return (
                <span
                  key={`text-${node.id}-${index}`}
                  className="text-2xl font-mono text-gray-600"
                >
                  &nbsp;{part.content}&nbsp;
                </span>
              );
            } else {
              // part.type === "name"
              return (
                <DropdownMenu key={`dropdown-${node.id}-${index}`}>
                  <DropdownMenuTrigger asChild>
                    <span className="flex  justify-center gap-1 items-center">
                      {/* <span
                        className="w-[10px] h-[10px] rounded-full"
                        style={{
                          backgroundColor: getMemberColor(part.id),
                        }}
                        title="Member's own color"
                      ></span> */}
                      <Badge
                        variant="outline"
                        style={{
                          padding: "0",
                          height: "20px",
                          width: "20px",
                          backgroundColor: `${getMemberColor(part.id)}33`,
                          border: `1px solid ${getMemberColor(part.id)}`,
                        }}
                      ></Badge>
                      <span
                        className={`text-sm font-mono cursor-pointer transition-colors ${
                          part.gender === "MALE"
                            ? "hover:bg-blue-100 hover:text-blue-800"
                            : part.gender === "FEMALE"
                            ? "hover:bg-rose-100 hover:text-rose-800"
                            : "hover:bg-gray-100"
                        } px-2 py-1 rounded`}
                        style={
                          {
                            // borderBottom: `4px solid ${getMemberColor(part.id)}`,
                            // color: `${getMemberColor(part.id)}`,
                          }
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "Dropdown trigger clicked for:",
                            part.name
                          );
                        }}
                      >
                        {part.name}
                      </span>
                      <div className="flex h-full justify-center gap-[5px] items-center">
                        {/* <span
                          className="w-3 h-1"
                          style={{
                            backgroundColor: getMemberColor(part.id),
                          }}
                          title="Member's own color"
                        ></span> */}

                        {getMemberParent1Color(part.id) && (
                          <Badge
                            variant="outline"
                            style={{
                              padding: "0",
                              height: "10px",
                              width: "10px",
                              backgroundColor: `${getMemberParent1Color(
                                part.id
                              )}33`,
                              border: `1px solid ${getMemberParent1Color(
                                part.id
                              )}`,
                            }}
                          ></Badge>
                        )}
                        {getMemberParent2Color(part.id) && (
                          <Badge
                            variant="outline"
                            style={{
                              padding: "0",
                              height: "10px",
                              width: "10px",
                              backgroundColor: `${getMemberParent2Color(
                                part.id
                              )}33`,
                              border: `1px solid ${getMemberParent2Color(
                                part.id
                              )}`,
                            }}
                          ></Badge>
                        )}
                        {/* <div>
                          {getMemberParent1Color(part.id) && (
                            <div
                              className="w-[7px] h-[7px] rounded-full"
                              style={{
                                backgroundColor: getMemberParent1Color(part.id),
                              }}
                              title="Parent 1 color"
                            ></div>
                          )}
                        </div>
                        <div>
                          {getMemberParent2Color(part.id) && (
                            <div
                              className="w-[7px] h-[7px] rounded-full"
                              style={{
                                backgroundColor: getMemberParent2Color(part.id),
                              }}
                              title="Parent 2 color"
                            ></div>
                          )}
                        </div> */}
                      </div>
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
                        console.log("View info clicked for:", part.name);
                        handleViewInfo(node, part.id);
                      }}
                      className="cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View infos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Edit info clicked for:", part.name);
                        handleEditInfo(node, part.id);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit infos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Add parent clicked for:", part.name);
                        handleAddRelationship("child", {
                          id: part.id,
                          name: part.name,
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
                        console.log("Add spouse clicked for:", part.name);
                        handleAddRelationship("spouse", {
                          id: part.id,
                          name: part.name,
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
                        console.log("Add child clicked for:", part.name);
                        handleAddRelationship("parent", {
                          id: part.id,
                          name: part.name,
                        });
                      }}
                      className="cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add a child
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
          })}
          <Badge variant="outline" className="ml-2 text-xs">
            Gen {node.column}
          </Badge>
        </div>

        {/* Render Children */}
        {node.hasChildren && node.expanded && (
          <div>
            {node.children.map((child) => child.value && renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const memberCount = folderTreeData?.length || 0;

  return (
    <Card className="w-full" key={`tree-container-${dropdownKey}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <FolderTree className="h-5 w-5 text-green-600" />
              <span>Family Folder Tree View</span>
              <Badge variant="outline">Interactive</Badge>
              <Badge variant="outline">{memberCount} members</Badge>
              {isAdmin && <Badge variant="outline">Admin View</Badge>}
            </div>
            <p className="text-sm text-gray-600 mt-2 font-normal">
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
          ) : treeStructure.length > 0 ? (
            treeStructure.map((node) => renderTreeNode(node))
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
          <p className="mt-2">
            <strong>Color System:</strong>
          </p>
          <div className="flex flex-wrap gap-4 mt-1">
            <span>● Main color (member's own color)</span>
            <span>○ Parent colors (inherited from parents)</span>
            <span>Colors help visualize inheritance patterns</span>
            <span>Multiple spouses show combined children</span>
          </div>
        </div>
      </CardContent>

      {/* Add Family Member Dialog - Always render to prevent dropdown state issues */}
      <AddFamilyMemberDialog
        familyId={familyId}
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setAddRelationshipType(null);
            setSelectedMemberForRelationship(null);
            setPreSelectedRelationship(null);
          }
        }}
        preSelectedRelationship={preSelectedRelationship}
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

// Edit Member Dialog Component
function EditMemberDialog({
  open,
  onOpenChange,
  memberId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
}) {
  const { user } = useAppSelector((state) => state.auth);
  const { data: families = [] } = useFamilies();
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

  const updateProfileMutation = useUpdateProfile();
  const { data: familyMembers = [], isLoading: familyMembersLoading } =
    useFamilyMembers(member?.familyMemberships?.[0]?.familyId || "");

  const [relationships, setRelationships] = useState<RelationshipEntry[]>([]);
  const [originalRelationships, setOriginalRelationships] = useState<
    RelationshipEntry[]
  >([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateMemberRequest>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Initialize form with member data and relationships
  useEffect(() => {
    if (member && open) {
      reset({
        name: member.name,
        gender: member.gender,
        status: member.status,
        personalInfo: {
          bio: member.personalInfo?.bio || "",
          birthDate: member.personalInfo?.birthDate || "",
          birthPlace: member.personalInfo?.birthPlace || "",
          occupation: member.personalInfo?.occupation || "",
          phoneNumber: member.personalInfo?.phoneNumber || "",
          email: member.personalInfo?.email || "",
        },
      });

      // Initialize relationships from existing member data
      const existingRelationships: RelationshipEntry[] = [];
      member.parents?.forEach((parent) => {
        existingRelationships.push({
          relatedMemberId: parent.id,
          relatedMemberName: parent.name,
          relationshipType: RelationshipType.PARENT,
        });
      });
      member.children?.forEach((child) => {
        existingRelationships.push({
          relatedMemberId: child.id,
          relatedMemberName: child.name,
          relationshipType: RelationshipType.CHILD,
        });
      });
      member.spouses?.forEach((spouse) => {
        existingRelationships.push({
          relatedMemberId: spouse.id,
          relatedMemberName: spouse.name,
          relationshipType: RelationshipType.SPOUSE,
        });
      });

      // Store original relationships for comparison
      setOriginalRelationships(existingRelationships);
      setRelationships(existingRelationships);
    }
  }, [member, open, reset]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailableMembers = () => {
    const existingRelationshipIds = new Set(
      relationships.map((r) => r.relatedMemberId)
    );
    // Don't include the current member being edited
    existingRelationshipIds.add(memberId || "");

    return familyMembers.filter(
      (familyMember) => !existingRelationshipIds.has(familyMember.id)
    );
  };

  const addRelationship = () => {
    if (!selectedMember || !relationshipType) return;

    const newRelationship: RelationshipEntry = {
      relatedMemberId: selectedMember.id,
      relatedMemberName: selectedMember.name,
      relationshipType,
    };

    setRelationships((prev) => [...prev, newRelationship]);
    setSelectedMember(null);
    setRelationshipType(null);
  };

  const removeRelationship = (index: number) => {
    setRelationships((prev) => prev.filter((_, i) => i !== index));
  };

  const getRelationshipTypeLabel = (type: RelationshipType) => {
    switch (type) {
      case RelationshipType.PARENT:
        return "Parent";
      case RelationshipType.CHILD:
        return "Child";
      case RelationshipType.SPOUSE:
        return "Spouse";
      default:
        return type;
    }
  };

  const onSubmit = async (data: UpdateMemberRequest) => {
    console.log("🔄 [FRONTEND] ===== MEMBER UPDATE PROCESS STARTED =====");
    console.log("🔄 [FRONTEND] Timestamp:", new Date().toISOString());

    if (!memberId) {
      console.error("❌ [FRONTEND] No member ID provided for update");
      // alert("Error: No member ID provided");
      return;
    }

    console.log("✅ [FRONTEND] Member ID validated:", memberId);

    try {
      // Step 1: Update member profile information
      console.log("📤 [FRONTEND] Step 1: Updating member profile...");
      await apiClient.put<MemberWithRelationships>(
        `/members/${memberId}`,
        data
      );
      console.log("✅ [FRONTEND] Member profile updated successfully");

      // Step 2: Process relationship changes
      console.log("📤 [FRONTEND] Step 2: Processing relationship changes...");

      // Find relationships to add (in current form but not in original)
      const relationshipsToAdd = relationships.filter(
        (currentRel) =>
          !originalRelationships.some(
            (originalRel) =>
              originalRel.relatedMemberId === currentRel.relatedMemberId &&
              originalRel.relationshipType === currentRel.relationshipType
          )
      );

      // Find relationships to remove (in original but not in current form)
      const relationshipsToRemove = originalRelationships.filter(
        (originalRel) =>
          !relationships.some(
            (currentRel) =>
              currentRel.relatedMemberId === originalRel.relatedMemberId &&
              currentRel.relationshipType === originalRel.relationshipType
          )
      );

      console.log(
        `➕ [FRONTEND] Relationships to add: ${relationshipsToAdd.length}`
      );
      console.log(
        `➖ [FRONTEND] Relationships to remove: ${relationshipsToRemove.length}`
      );

      // Process additions first
      for (const rel of relationshipsToAdd) {
        try {
          console.log(
            `📤 [FRONTEND] Adding ${rel.relationshipType} relationship with ${rel.relatedMemberName}...`
          );
          await apiClient.post(`/members/${memberId}/relationships`, {
            relatedMemberId: rel.relatedMemberId,
            relationshipType: rel.relationshipType,
            familyId: member?.familyMemberships?.[0]?.familyId,
          });
          console.log(
            `✅ [FRONTEND] Successfully added relationship with ${rel.relatedMemberName}`
          );
        } catch (relError) {
          console.error(
            `❌ [FRONTEND] Failed to add relationship with ${rel.relatedMemberName}:`,
            relError
          );
          // Continue with other operations
        }
      }

      // Process removals
      for (const rel of relationshipsToRemove) {
        try {
          console.log(
            `📤 [FRONTEND] Removing ${rel.relationshipType} relationship with ${rel.relatedMemberName}...`
          );
          await apiClient.delete(`/members/${memberId}/relationships`, {
            relatedMemberId: rel.relatedMemberId,
            relationshipType: rel.relationshipType,
            familyId: member?.familyMemberships?.[0]?.familyId,
          });
          console.log(
            `✅ [FRONTEND] Successfully removed relationship with ${rel.relatedMemberName}`
          );
        } catch (relError) {
          console.error(
            `❌ [FRONTEND] Failed to remove relationship with ${rel.relatedMemberName}:`,
            relError
          );
          // Continue with other operations
        }
      }

      console.log("🎉 [FRONTEND] Member update process completed successfully");
      console.log("🔄 [FRONTEND] ===== MEMBER UPDATE PROCESS COMPLETED =====");

      // Show success message
      // alert(
      //   "Member updated successfully! All changes have been saved to the database."
      // );

      // Close the dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ [FRONTEND] Failed to update member:", error);
      console.log("🔄 [FRONTEND] ===== MEMBER UPDATE PROCESS FAILED =====");

      // Provide detailed error message
      let errorMessage = "Failed to update member. Please try again.";

      if (error?.response?.status === 403) {
        errorMessage = "You don't have permission to edit this member.";
      } else if (error?.response?.status === 404) {
        errorMessage = "Member not found or no longer exists.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // alert(errorMessage);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setRelationships([]);
    setSelectedMember(null);
    setRelationshipType(null);
  };

  return (
    <CustomDialog open={open} onOpenChange={handleClose}>
      <CustomDialogContent className="sm:max-w-[900px] lg:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Edit Family Member</span>
          </CustomDialogTitle>
          <CustomDialogDescription>
            Update the member's personal information and manage their
            relationships.
          </CustomDialogDescription>
          <CustomDialogClose onClick={handleClose} />
        </CustomDialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        ) : member ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Family Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Family Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Current Family</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">
                      {member.familyMemberships?.[0]?.familyName ||
                        "Unknown Family"}
                    </span>
                    <Badge variant="outline">
                      {member.familyMemberships?.[0]?.role || "Member"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      {...register("name", {
                        required: "Name is required",
                        minLength: {
                          value: 1,
                          message: "Name cannot be empty",
                        },
                      })}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("gender", value as Gender)
                      }
                      defaultValue={member.gender}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Gender.PREFER_NOT_TO_SAY}>
                          Prefer not to say
                        </SelectItem>
                        <SelectItem value={Gender.MALE}>Male</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                        <SelectItem value={Gender.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("status", value as MemberStatus)
                      }
                      defaultValue={member.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MemberStatus.ACTIVE}>
                          Active
                        </SelectItem>
                        <SelectItem value={MemberStatus.INACTIVE}>
                          Inactive
                        </SelectItem>
                        <SelectItem value={MemberStatus.DECEASED}>
                          Deceased
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Family Role</Label>
                    <div className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50">
                      <Badge variant="outline">
                        {member.familyMemberships?.[0]?.role || "Member"}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Role cannot be changed here
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relationships Management */}
            {member.familyMemberships?.[0]?.familyId && (
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Heart className="h-5 w-5 text-green-600" />
                    <span>Relationships Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {familyMembersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <ClipLoader size={24} color="#2563eb" />
                      <span className="ml-2 text-sm text-gray-600">
                        Loading family members...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Add Relationship Form */}
                      <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                        <div className="space-y-2">
                          <Label>Select Family Member</Label>
                          <ReactSelect
                            value={
                              selectedMember
                                ? {
                                    value: selectedMember.id,
                                    label: selectedMember.name,
                                    member: selectedMember,
                                  }
                                : null
                            }
                            onChange={(option) => {
                              setSelectedMember(option ? option.member : null);
                            }}
                            options={getAvailableMembers().map((member) => ({
                              value: member.id,
                              label: member.name,
                              member: member,
                            }))}
                            formatOptionLabel={(option, { context }) => (
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(option.member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{option.label}</span>
                              </div>
                            )}
                            placeholder="Select a family member..."
                            isClearable
                            className="react-select-container"
                            classNamePrefix="react-select"
                            styles={{
                              control: (base) => ({
                                ...base,
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                minHeight: "40px",
                                "&:hover": {
                                  borderColor: "#9ca3af",
                                },
                              }),
                              option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                  ? "#3b82f6"
                                  : state.isFocused
                                  ? "#eff6ff"
                                  : "white",
                                color: state.isSelected ? "white" : "black",
                                "&:hover": {
                                  backgroundColor: state.isSelected
                                    ? "#2563eb"
                                    : "#f3f4f6",
                                },
                              }),
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Relationship Type</Label>
                          <Select
                            onValueChange={(value) =>
                              setRelationshipType(value as RelationshipType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={RelationshipType.PARENT}>
                                {selectedMember?.name || "This person"} is the
                                Parent
                              </SelectItem>
                              <SelectItem value={RelationshipType.CHILD}>
                                {selectedMember?.name || "This person"} is the
                                Child
                              </SelectItem>
                              <SelectItem value={RelationshipType.SPOUSE}>
                                {selectedMember?.name || "This person"} is the
                                Spouse
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          type="button"
                          onClick={addRelationship}
                          disabled={!selectedMember || !relationshipType}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Relationship
                        </Button>
                      </div>

                      {/* Existing Relationships */}
                      {relationships.length > 0 && (
                        <div className="space-y-2">
                          <Label>Current Relationships</Label>
                          <div className="space-y-2">
                            {relationships.map((relationship, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded-lg"
                              >
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(
                                        relationship.relatedMemberName
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {relationship.relatedMemberName}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {getRelationshipTypeLabel(
                                        relationship.relationshipType
                                      )}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRelationship(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Personal Information (Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    {...register("personalInfo.bio")}
                    placeholder="Brief biography or description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      {...register("personalInfo.birthDate")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">Birth Place</Label>
                    <Input
                      id="birthPlace"
                      {...register("personalInfo.birthPlace")}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      {...register("personalInfo.occupation")}
                      placeholder="Job title or profession"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...register("personalInfo.phoneNumber")}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("personalInfo.email")}
                    placeholder="email@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateProfileMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {updateProfileMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <ClipLoader size={16} color="white" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
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
