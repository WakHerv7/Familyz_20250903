import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Gender } from "@/types";
import { ChevronRight, ChevronDown, User } from "lucide-react";
import { FamilyTreeNode } from "../types";
import { getGenderColor, getInitials } from "../utils";

interface FamilyTreeItemProps {
  node: FamilyTreeNode;
  level: number;
  onMemberClick?: (memberId: string) => void;
  currentMemberId?: string;
  isExpanded?: boolean;
  onToggleExpansion?: (nodeId: string) => void;
  expandedNodes?: Set<string>;
}

export const FamilyTreeItem: React.FC<FamilyTreeItemProps> = ({
  node,
  level,
  onMemberClick,
  currentMemberId,
  isExpanded: externalIsExpanded,
  onToggleExpansion,
  expandedNodes,
}) => {
  // Use external state if provided, otherwise use local state
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const isExpanded = expandedNodes
    ? expandedNodes.has(node.id)
    : externalIsExpanded !== undefined
    ? externalIsExpanded
    : localIsExpanded;

  const hasChildren =
    node.children.length > 0 ||
    node.spouses.length > 0 ||
    node.parents.length > 0;

  // Debug logging for expansion state
  if (level === 0) {
    console.log("🌳 Root Node Debug:", {
      name: node.name,
      id: node.id,
      hasChildren,
      childrenCount: node.children.length,
      spousesCount: node.spouses.length,
      parentsCount: node.parents.length,
      isExpanded,
      level,
    });
  }

  const toggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("🔄 Toggle expansion for:", node.name, {
      currentState: isExpanded,
      newState: !isExpanded,
      hasExternalHandler: !!onToggleExpansion,
    });

    if (onToggleExpansion) {
      onToggleExpansion(node.id);
    } else {
      setLocalIsExpanded(!localIsExpanded);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer rounded ${
          node.id === currentMemberId ? "bg-blue-50 border border-blue-200" : ""
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onMemberClick?.(node.id)}
      >
        {hasChildren && (
          <button
            onClick={toggleExpansion}
            className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        <User className="h-4 w-4 mr-2 text-gray-400" />
        <span className="text-sm font-medium">{node.name}</span>
        {node.id === currentMemberId && (
          <Badge variant="outline" className="ml-2 text-xs">
            You
          </Badge>
        )}
        <Badge
          variant="outline"
          className="ml-2 text-xs"
          style={{
            backgroundColor:
              node.gender === Gender.MALE
                ? "#DBEAFE"
                : node.gender === Gender.FEMALE
                ? "#FCE7F3"
                : "#F3F4F6",
            borderColor:
              node.gender === Gender.MALE
                ? "#3B82F6"
                : node.gender === Gender.FEMALE
                ? "#EC4899"
                : "#6B7280",
          }}
        >
          {node.gender === Gender.MALE
            ? "♂"
            : node.gender === Gender.FEMALE
            ? "♀"
            : "?"}
        </Badge>
        {node.generation !== undefined && node.generation !== 0 && (
          <Badge variant="outline" className="ml-1 text-xs">
            Gen {node.generation > 0 ? `+${node.generation}` : node.generation}
          </Badge>
        )}
      </div>

      {isExpanded && (
        <div>
          {/* Show spouses at the same level */}
          {node.spouses.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 font-medium ml-4 mt-1 mb-1">
                Spouse{node.spouses.length > 1 ? "s" : ""}
              </div>
              {node.spouses.map((spouse) => (
                <FamilyTreeItem
                  key={spouse.id}
                  node={spouse}
                  level={level}
                  onMemberClick={onMemberClick}
                  currentMemberId={currentMemberId}
                  expandedNodes={expandedNodes}
                  onToggleExpansion={onToggleExpansion}
                />
              ))}
            </div>
          )}

          {/* Show children as descendants */}
          {node.children.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 font-medium ml-4 mt-1 mb-1">
                Children
              </div>
              {node.children.map((child) => (
                <FamilyTreeItem
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onMemberClick={onMemberClick}
                  currentMemberId={currentMemberId}
                  expandedNodes={expandedNodes}
                  onToggleExpansion={onToggleExpansion}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
