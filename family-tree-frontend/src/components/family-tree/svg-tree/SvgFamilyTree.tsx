"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Network,
} from "lucide-react";

// Import our modular components and utilities
import { TreeNode } from "../../../types";
import { InteractiveFamilyTreeProps } from "../../../components/family-tree/types/interfaces";
import { getGenderColor } from "../../../components/family-tree/utils";
import { useZoomPan } from "./hooks/useZoomPan";
import {
  calculateTreePositions,
  calculateViewBox,
  PositionedNode,
  CoupleConnection,
  LineConnection,
} from "./utils/treeCalculations";
import { TreeCanvas } from "./components/TreeCanvas";

interface SvgFamilyTreeProps extends InteractiveFamilyTreeProps {
  treeData?: {
    nodes: TreeNode[];
    connections?: any[];
    metadata?: any;
  };
  isLoading?: boolean;
  error?: any;
}

export default function SvgFamilyTree({
  currentMember,
  onMemberClick,
  treeData,
  isLoading,
  error,
}: SvgFamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isViewBoxCustom, setIsViewBoxCustom] = useState(false);
  const [baseViewBox, setBaseViewBox] = useState({
    x: -300,
    y: 0,
    w: 1000,
    h: 800,
  });

  // Tree data state
  const [positionedNodes, setPositionedNodes] = useState<PositionedNode[]>([]);
  const [couples, setCouples] = useState<CoupleConnection[]>([]);
  const [lines, setLines] = useState<LineConnection[]>([]);

  // Zoom and pan functionality
  const zoomPan = useZoomPan(svgRef, baseViewBox);

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
      setBaseViewBox(optimalViewBox); // Update base viewBox for zoom calculations
      console.log("SVG Tree - Base ViewBox set to:", optimalViewBox);
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
        gender: node.gender,
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
          <span>Loading SVG family tree...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8 text-red-600">
          <p>Failed to load SVG family tree</p>
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
          <CardTitle className="flex items-center space-x-2">
            <Network className=" text-orange-600 h-5 w-5" />
            <span>Hierarchical Family Tree</span>
            {/* <span>SVG Family Tree</span> */}
          </CardTitle>
          <div className="flex items-center space-x-2 gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 ml-3">
                <Badge variant="outline">{memberCount} members</Badge>
                <Badge variant="outline">
                  Zoom: {Math.round(zoomPan.zoomLevel * 100)}%
                </Badge>
                {/* <Badge variant="default">SVG View</Badge> */}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomPan.downloadSVG}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          {/* <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={zoomPan.downloadSVG}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div> */}

          {/* SVG Canvas */}
          <TreeCanvas
            positionedNodes={positionedNodes}
            couples={couples}
            lines={lines}
            viewBox={zoomPan.viewBox}
            currentMemberId={currentMember.id}
            onMemberClick={handleMemberClick}
            onMouseDown={zoomPan.handleMouseDown}
            onMouseMove={zoomPan.handleMouseMove}
            onMouseUp={zoomPan.handleMouseUp}
            onWheel={zoomPan.handleWheel}
            onMouseEnter={() => {
              console.log("🐭 MOUSE ENTER SVG");
              zoomPan.setMouseOverSvg(true);
            }}
            onMouseLeave={() => {
              console.log("🐭 MOUSE LEAVE SVG");
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
              • <strong>Mouse wheel</strong> to zoom in/out (only when over SVG)
            </p>
            <p>
              • <strong>Normal page scroll</strong> when mouse is outside SVG
              area
            </p>
            <p>
              • Use <strong>zoom controls</strong> as alternative
            </p>
            <p>
              • <strong>Generation numbers</strong> shown above nodes (when
              applicable)
            </p>
            <p>
              • <strong>Algorithmic layout:</strong> Positions calculated based
              on generations and relationships
            </p>
            <p>
              • <strong>Visual connections:</strong> Curved lines for
              parent-child, rounded paths for spouses
            </p>
          </div>

          {/* Selected Member Info */}
          {selectedNode && selectedNode.id !== currentMember.id && (
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
              <p>No family tree data available for SVG visualization.</p>
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
