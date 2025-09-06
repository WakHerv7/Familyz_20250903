import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2 } from "lucide-react";
import { FamilyTreeItem } from "./FamilyTreeItem";
import { buildFamilyTreeFromApiData } from "../utils";

interface ExplorerViewProps {
  treeData: any;
  treeLoading: boolean;
  treeError: any;
  refetchTree: () => void;
  familyId: string | undefined;
  nodes: any[];
  onMemberClick?: (memberId: string) => void;
  currentMemberId: string;
  expandedNodes: Set<string>;
  toggleNodeExpansion: (nodeId: string) => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  treeData,
  treeLoading,
  treeError,
  refetchTree,
  familyId,
  nodes,
  onMemberClick,
  currentMemberId,
  expandedNodes,
  toggleNodeExpansion,
}) => {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Family Tree Explorer</span>
        </CardTitle>
        <div className="text-sm text-gray-600">
          Complete family tree from oldest ancestor to present generation
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {treeLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading family tree...</span>
          </div>
        ) : treeError ? (
          <div className="text-center py-8 text-red-600">
            <p>Failed to load family tree</p>
            <p className="text-sm text-gray-500 mt-1">
              {treeError.message || "Please try again later"}
            </p>
            {treeError.message?.includes("Access denied") && (
              <p className="text-sm text-gray-500 mt-1">
                You may not have access to this family. Try logging in again or
                contact the family administrator.
              </p>
            )}
            <Button
              onClick={() => refetchTree()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : !familyId ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No family access available</p>
            <p className="text-sm">
              You need to be a member of a family to view the family tree. Try
              logging in again or contact your family administrator.
            </p>
          </div>
        ) : nodes.length > 0 ? (
          <div className="max-h-96 overflow-y-auto border rounded-lg bg-gray-50">
            {/* Use the new API data tree builder */}
            {(() => {
              const familyTreeRoot =
                treeData && treeData.nodes && Array.isArray(treeData.nodes)
                  ? buildFamilyTreeFromApiData(treeData)
                  : null;
              return familyTreeRoot ? (
                <FamilyTreeItem
                  node={familyTreeRoot}
                  level={0}
                  onMemberClick={onMemberClick}
                  currentMemberId={currentMemberId}
                  expandedNodes={expandedNodes}
                  onToggleExpansion={toggleNodeExpansion}
                />
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Unable to build family tree structure
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No family tree data available</p>
            <p className="text-sm">Try switching to a different view mode</p>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          Click the arrows to expand/collapse family branches • Click names to
          view details
        </div>
      </CardContent>
    </Card>
  );
};
