"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { MemberWithRelationships } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface TreeEntry {
  column: number;
  value: string;
  memberIds: { id: string; name: string; gender: string }[];
}

interface TreeNode {
  id: string;
  value: string;
  column: number;
  memberIds: { id: string; name: string; gender: string }[];
  children: TreeNode[];
  expanded: boolean;
  hasChildren: boolean;
}

interface FolderTreeViewProps {
  currentMember: MemberWithRelationships;
  isAdmin?: boolean;
  onMemberClick?: (memberId: string) => void;
}

export default function FolderTreeView({
  currentMember,
  isAdmin = false,
  onMemberClick,
}: FolderTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
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

  // Fetch folder tree data with member IDs for the FolderTreeView
  const { data: treeData = [], isLoading } = useQuery({
    queryKey: ["folder-tree-data-with-ids"],
    queryFn: async () => {
      const response = await apiClient.get<TreeEntry[]>(
        "/export/folder-tree-data-with-ids"
      );
      return response;
    },
  });

  // Compute initial expanded nodes from treeData
  const initialExpanded = useMemo(() => {
    if (!treeData.length) return new Set<string>();

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

    return computeExpandable(treeData);
  }, [treeData]);

  // Set expanded nodes to initial expanded when treeData changes
  useEffect(() => {
    setExpandedNodes(initialExpanded);
  }, [initialExpanded]);

  // Build hierarchical tree structure from flat data
  const treeStructure = useMemo(() => {
    if (!treeData.length) return [];

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

    console.log("treeData :: ", treeData);
    console.log("expandedNodes :: ", expandedNodes);

    return buildTree(treeData);
  }, [treeData, expandedNodes]);

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

  const handleViewInfo = (node: TreeNode, memberName?: string) => {
    // Find the corresponding tree entry to get the memberIds
    const treeEntry = treeData.find((entry, index) => {
      const stableId = `${entry.column}-${entry.value.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}-${index}`;
      return stableId === node.id;
    });

    const memberIds = node?.memberIds;
    if (memberIds && memberIds.length > 0) {
      let memberId: string;

      if (memberName) {
        // Find the member ID by name
        const member = memberIds.find((m) => m.name === memberName);
        if (member) {
          memberId = member.id;
        } else {
          // Fallback to first member if name not found
          memberId = memberIds[0].id;
          console.warn(
            `Member name "${memberName}" not found, using first member`
          );
        }
      } else {
        // No specific name provided, use first member
        memberId = memberIds[0].id;
      }

      setSelectedMemberId(memberId);
      setShowViewDialog(true);
      console.log(
        "View info for:",
        memberName || node.value,
        "ID:",
        memberId,
        "Total members:",
        memberIds.length
      );
    } else {
      console.error("No memberIds found for node:", node.value);
    }
  };

  const handleEditInfo = (node: TreeNode) => {
    // TODO: Implement edit info functionality
    console.log("Edit info for:", node.value);
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

    // Decompose node.value into alternating text segments and member names
    const decomposeValue = (
      value: string,
      memberIds: { id: string; name: string; gender: string }[]
    ) => {
      if (!value) return [];

      // Create a map of names to their genders
      const nameToGender = new Map<string, string>();
      memberIds?.forEach((member) => {
        nameToGender.set(member.name, member.gender);
      });

      const result: (
        | { type: "text"; content: string }
        | { type: "name"; name: string; gender: string }
      )[] = [];

      let remainingText = value;
      let lastEndIndex = 0;

      // Find names in the order they appear in the text
      while (remainingText.length > 0) {
        let foundName = null;
        let foundIndex = -1;

        // Check each member name to see if it appears in the remaining text
        for (const [name] of nameToGender) {
          const nameIndex = remainingText.indexOf(name);
          if (
            nameIndex !== -1 &&
            (foundIndex === -1 || nameIndex < foundIndex)
          ) {
            foundName = name;
            foundIndex = nameIndex;
          }
        }

        if (foundName && foundIndex !== -1) {
          // Add text before the name (if any)
          if (foundIndex > 0) {
            const textBefore = remainingText.slice(0, foundIndex);
            if (textBefore.trim()) {
              result.push({ type: "text", content: textBefore });
            }
          }

          // Add the name
          const gender = nameToGender.get(foundName) || "UNKNOWN";
          result.push({ type: "name", name: foundName, gender });

          // Remove the processed part
          remainingText = remainingText.slice(foundIndex + foundName.length);
        } else {
          // No more names found, add remaining text
          if (remainingText.trim()) {
            result.push({ type: "text", content: remainingText });
          }
          break;
        }
      }

      return result;
    };

    const decomposedParts = decomposeValue(node.value, node.memberIds);

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
              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs text-blue-600">●</span>
              </div>
            ) : (
              <></>
            )}
          </div>

          {/* Render decomposed parts */}
          {decomposedParts.map((part, index) => {
            if (part.type === "text") {
              return (
                <span
                  key={`text-${node.id}-${index}`}
                  className="text-sm font-mono text-gray-600"
                >
                  {part.content}
                </span>
              );
            } else {
              // part.type === "name"
              return (
                <DropdownMenu key={`dropdown-${node.id}-${index}`}>
                  <DropdownMenuTrigger asChild>
                    <span
                      className={`text-sm font-mono cursor-pointer transition-colors ${
                        part.gender === "MALE"
                          ? "hover:bg-blue-100 hover:text-blue-800"
                          : part.gender === "FEMALE"
                          ? "hover:bg-rose-100 hover:text-rose-800"
                          : "hover:bg-gray-100"
                      } px-2 py-1 rounded`}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Dropdown trigger clicked for:", part.name);
                      }}
                    >
                      {part.name}
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
                        handleViewInfo(node, part.name);
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
                        console.log("Add parent clicked for:", part.name);
                        const member = node.memberIds.find(
                          (m) => m.name === part.name
                        );
                        if (member) {
                          handleAddRelationship("parent", {
                            id: member.id,
                            name: member.name,
                          });
                        }
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
                        const member = node.memberIds.find(
                          (m) => m.name === part.name
                        );
                        if (member) {
                          handleAddRelationship("spouse", {
                            id: member.id,
                            name: member.name,
                          });
                        }
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
                        const member = node.memberIds.find(
                          (m) => m.name === part.name
                        );
                        if (member) {
                          handleAddRelationship("child", {
                            id: member.id,
                            name: member.name,
                          });
                        }
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

  return (
    <Card className="w-full" key={`tree-container-${dropdownKey}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="text-green-600 h-5 w-5" />
            <span>Family Tree Explorer</span>
            {isAdmin && <Badge variant="outline">Admin View</Badge>}
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
        </div>
      </CardContent>

      {/* Add Family Member Dialog - Always render to prevent dropdown state issues */}
      <AddFamilyMemberDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setAddRelationshipType(null);
            setSelectedMemberForRelationship(null);
            // Force re-render of dropdown menus when dialog closes
            // setDropdownKey((prev) => prev + 1);
          }
        }}
        initialRelationship={{
          type: addRelationshipType,
          member: selectedMemberForRelationship,
        }}
      />

      {/* View Member Dialog */}
      <ViewMemberDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        memberId={selectedMemberId || undefined}
      />
    </Card>
  );
}
