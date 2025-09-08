"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  GitBranch,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Users,
} from "lucide-react";
import { useFamilyTree } from "@/hooks/api";
import { ClipLoader } from "react-spinners";

// Import our modular components and utilities
import { TreeNode, Gender } from "../../types";
import { InteractiveFamilyTreeProps } from "../../components/family-tree/types/interfaces";
import { getGenderColor } from "../../components/family-tree/utils";
import { useZoomPan } from "./hooks/useZoomPan";
import {
  calculateTreePositions,
  calculateViewBox,
  PositionedNode,
  CoupleConnection,
  LineConnection,
} from "./utils/treeCalculations";
import { HierarchicalTreeCanvas } from "./components/HierarchicalTreeCanvas";

interface FamilyHierarchicalViewProps {
  familyId: string;
  profile: any;
  onMemberClick?: (memberId: string) => void;
}

export default function FamilyHierarchicalView({
  familyId,
  profile,
  onMemberClick,
}: FamilyHierarchicalViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isViewBoxCustom, setIsViewBoxCustom] = useState(false);
  const [baseViewBox, setBaseViewBox] = useState({
    x: -400,
    y: -300,
    w: 800,
    h: 600,
  });

  // Fetch family-specific tree data
  const {
    data: treeData,
    isLoading,
    error,
  } = useFamilyTree(familyId, profile?.id, 3);

  // Tree data state
  const [positionedNodes, setPositionedNodes] = useState<PositionedNode[]>([]);
  const [couples, setCouples] = useState<CoupleConnection[]>([]);
  const [lines, setLines] = useState<LineConnection[]>([]);

  // Zoom and pan functionality
  const zoomPan = useZoomPan({ svgRef, baseViewBox });

  // Process tree data and calculate positions
  useEffect(() => {
    if (!treeData?.nodes?.length) {
      setPositionedNodes([]);
      setCouples([]);
      setLines([]);
      return;
    }

    const {
      positionedNodes: nodes,
      couples: coupleConnections,
      lines: lineConnections,
    } = calculateTreePositions(treeData.nodes, treeData.connections || []);

    setPositionedNodes(nodes);
    setCouples(coupleConnections);
    setLines(lineConnections);

    // Set a fixed, guaranteed visible viewBox only if user hasn't customized the view
    if (nodes.length > 0 && !isViewBoxCustom) {
      const optimalViewBox = calculateViewBox(nodes);
      setBaseViewBox(optimalViewBox);
      console.log(
        "Family Hierarchical View - Base ViewBox set to:",
        optimalViewBox
      );
    }
  }, [treeData, isViewBoxCustom]);

  // Handle member click
  const handleMemberClick = (id: string) => {
    const node = positionedNodes.find((n) => n.id === id);
    if (node) {
      // Convert PositionedNode back to TreeNode for state
      const treeNode: TreeNode = {
        id: node.id,
        name: node.name,
        gender: node.gender as Gender,
        x: node.x,
        y: node.y,
        level: (node as any).level || node.generation || 0,
        parents: (node as any).parents || [],
        children: (node as any).children || [],
        spouses: (node as any).spouses || [],
        status: (node as any).status || ("ACTIVE" as any),
      };
      setSelectedNode(treeNode);
      onMemberClick?.(id);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    zoomPan.handleZoomIn();
    setIsViewBoxCustom(true);
  };

  const handleZoomOut = () => {
    zoomPan.handleZoomOut();
    setIsViewBoxCustom(true);
  };

  const handleReset = () => {
    zoomPan.handleReset();
    setIsViewBoxCustom(false);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading family hierarchical view...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8 text-red-600">
          <p>Failed to load family hierarchical view</p>
          <p className="text-sm text-gray-500 mt-1">
            {error.message || "Please try again later"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const memberCount =
    treeData?.metadata?.totalMembers || treeData?.nodes?.length || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5 text-purple-600" />
              <span>Hierarchical View</span>
              <Badge variant="outline">Organized</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Clean hierarchical layout with generation-based organization
            </p>
          </div>
          {/* <CardTitle className="flex items-center space-x-2">
            <GitBranch className="text-purple-600 h-5 w-5" />
            <span>Family Hierarchical View</span>
          </CardTitle> */}
          <div className="flex items-center space-x-2 gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 ml-3">
                <Badge variant="outline">{memberCount} members</Badge>
                <Badge variant="outline">
                  Zoom: {Math.round(zoomPan.zoomLevel * 100)}%
                </Badge>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* SVG Canvas */}
          <HierarchicalTreeCanvas
            positionedNodes={positionedNodes}
            couples={couples}
            lines={lines}
            viewBox={zoomPan.viewBox}
            currentMemberId={profile?.id}
            onMemberClick={handleMemberClick}
            onMouseDown={zoomPan.handleMouseDown}
            onMouseMove={zoomPan.handleMouseMove}
            onMouseUp={zoomPan.handleMouseUp}
            onMouseEnter={() => {
              console.log("🐭 MOUSE ENTER Family Hierarchical View");
              zoomPan.setMouseOverSvg(true);
            }}
            onMouseLeave={() => {
              console.log("🐭 MOUSE LEAVE Family Hierarchical View");
              zoomPan.setMouseOverSvg(false);
            }}
            isPanning={zoomPan.isPanning}
            svgRef={svgRef}
          />

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              • <strong>Click nodes</strong> to view member details
            </p>
            <p>
              • <strong>Drag background</strong> to pan around the tree
            </p>
            <p>
              • <strong>Mouse wheel</strong> to zoom in/out
            </p>
            <p>
              • <strong>Hierarchical layout</strong> shows parent-child
              relationships
            </p>
          </div>

          {/* Selected Member Info */}
          {selectedNode && selectedNode.id !== profile?.id && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback
                      style={{
                        backgroundColor: getGenderColor(selectedNode.gender),
                      }}
                    >
                      {selectedNode.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{selectedNode.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedNode.gender || "Unknown"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Generation:{" "}
                        {(() => {
                          const gen =
                            (selectedNode as any).level ||
                            (selectedNode as any).generation ||
                            0;
                          return gen === 0
                            ? "Same"
                            : gen > 0
                            ? `+${gen}`
                            : `${gen}`;
                        })()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!treeData?.nodes?.length && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No family tree data available for hierarchical view.</p>
              <p className="text-sm">
                Try switching to a different view mode or check your family
                data.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
