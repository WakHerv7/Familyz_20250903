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
import { useFamilyTree } from "@/hooks/api";
import { ClipLoader } from "react-spinners";
import { useZoomPan } from "./hooks/useZoomPan";
import {
  calculateTreePositions,
  calculateViewBox,
  PositionedNode,
  CoupleConnection,
  LineConnection,
} from "../family-tree/svg-tree/utils/treeCalculations";
import { SvgTreeCanvas } from "./components/SvgTreeCanvas";

interface FamilySvgTreeViewProps {
  familyId: string;
  profile: any;
  onMemberClick?: (memberId: string) => void;
}

export default function FamilySvgTreeView({
  familyId,
  profile,
  onMemberClick,
}: FamilySvgTreeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isViewBoxCustom, setIsViewBoxCustom] = useState(false);
  const [baseViewBox, setBaseViewBox] = useState({
    x: -500,
    y: -400,
    w: 1000,
    h: 800,
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
      console.log("Family SVG Tree - Base ViewBox set to:", optimalViewBox);
    }
  }, [treeData, isViewBoxCustom]);

  // Handle member click
  const handleMemberClick = (id: string) => {
    const node = positionedNodes.find((n) => n.id === id);
    if (node) {
      setSelectedNode(node);
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
          <span>Loading family SVG tree...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8 text-red-600">
          <p>Failed to load family SVG tree</p>
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
              <Network className="h-5 w-5 text-blue-600" />
              <span>SVG Tree View</span>
              <Badge variant="outline">Interactive</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Scalable vector graphics tree with zoom and pan capabilities
            </p>
          </div>
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
          {/* SVG Canvas */}
          <SvgTreeCanvas
            positionedNodes={positionedNodes}
            couples={couples}
            lines={lines}
            viewBox={zoomPan.viewBox}
            currentMemberId={profile?.id}
            onMemberClick={handleMemberClick}
            onMouseDown={zoomPan.handleMouseDown}
            onMouseMove={zoomPan.handleMouseMove}
            onMouseUp={zoomPan.handleMouseUp}
            onWheel={zoomPan.handleWheel}
            onMouseEnter={() => {
              console.log("🐭 MOUSE ENTER Family SVG");
              zoomPan.setMouseOverSvg(true);
            }}
            onMouseLeave={() => {
              console.log("🐭 MOUSE LEAVE Family SVG");
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
                        .map((n: any) => n[0])
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
                            selectedNode.generation || selectedNode.level || 0;
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

// Helper function for gender colors
function getGenderColor(gender?: string) {
  switch (gender) {
    case "MALE":
      return "#3B82F6"; // Blue
    case "FEMALE":
      return "#EC4899"; // Pink
    default:
      return "#6B7280"; // Gray
  }
}
