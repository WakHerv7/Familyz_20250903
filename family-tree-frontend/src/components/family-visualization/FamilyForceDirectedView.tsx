"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Network,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Users,
} from "lucide-react";
import { useFamilyTree } from "@/hooks/api";
import { ClipLoader } from "react-spinners";
import * as d3 from "d3";

interface FamilyForceDirectedViewProps {
  familyId: string;
  profile: any;
  onMemberClick?: (memberId: string) => void;
}

interface TreeNode {
  id: string;
  name: string;
  gender: string;
  generation: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  colors?: string[];
  originalName?: string;
}

// Helper function to parse color information from node name
function parseColorInfo(displayName: string): {
  colors: string[];
  cleanName: string;
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

  return { colors, cleanName };
}

interface TreeLink {
  source: TreeNode;
  target: TreeNode;
  type: "parent" | "child" | "spouse";
}

export default function FamilyForceDirectedView({
  familyId,
  profile,
  onMemberClick,
}: FamilyForceDirectedViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [simulation, setSimulation] = useState<d3.Simulation<
    TreeNode,
    TreeLink
  > | null>(null);

  // Fetch family-specific tree data
  const {
    data: treeData,
    isLoading,
    error,
  } = useFamilyTree(familyId, profile?.id, 3);

  // Process tree data for force-directed layout
  useEffect(() => {
    if (!treeData?.nodes?.length || !svgRef.current || !containerRef.current)
      return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll("*").remove();

    // Create main group for zoom/pan
    const g = svg.append("g").attr("class", "main-group");

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Transform backend data to D3-compatible format
    const nodes: TreeNode[] = treeData.nodes.map((node: any) => {
      // Parse color information from node name
      const { colors, cleanName } = parseColorInfo(node.name);
      return {
        id: node.id,
        name: cleanName, // Use clean name without color codes
        originalName: node.name, // Keep original for color parsing
        gender: node.gender,
        generation: node.level || node.generation || 0,
        colors: colors, // Store parsed colors
      };
    });

    // Create links from connections
    const links: TreeLink[] =
      treeData.connections
        ?.map((conn: any) => {
          const source = nodes.find((n) => n.id === conn.from);
          const target = nodes.find((n) => n.id === conn.to);
          return {
            source: source!,
            target: target!,
            type: conn.type,
          };
        })
        .filter((link) => link.source && link.target) || [];

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create force simulation
    const newSimulation = d3
      .forceSimulation<TreeNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<TreeNode, TreeLink>(links)
          .id((d) => d.id)
          .distance((d) => {
            const sameGeneration =
              (d.source as TreeNode).generation ===
              (d.target as TreeNode).generation;
            return d.type === "spouse" ? 80 : sameGeneration ? 120 : 150;
          })
          .strength((d) => (d.type === "spouse" ? 0.8 : 0.6))
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30))
      .force(
        "y",
        d3
          .forceY((d: TreeNode) => {
            const generation = d.generation || 0;
            return height / 2 + generation * 80;
          })
          .strength(0.1)
      );

    setSimulation(newSimulation);

    // Create gradient definitions
    const defs = svg.append("defs");

    // Drop shadow filter
    defs
      .append("filter")
      .attr("id", "drop-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%")
      .append("feDropShadow")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("stdDeviation", 3)
      .attr("flood-opacity", 0.3);

    // Arrow markers for different link types - smaller size
    // Parent arrow (blue)
    defs
      .append("marker")
      .attr("id", "arrow-parent")
      .attr("viewBox", "0 -3 5 5")
      .attr("refX", 16)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-3L6,0L0,3")
      .attr("fill", "#3B82F6");

    // Child arrow (green)
    defs
      .append("marker")
      .attr("id", "arrow-child")
      .attr("viewBox", "0 -3 5 5")
      .attr("refX", 16)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-3L6,0L0,3")
      .attr("fill", "#10B981");

    // Spouse arrow (pink) - smallest for spouse connections
    defs
      .append("marker")
      .attr("id", "arrow-spouse")
      .attr("viewBox", "0 -2 4 4")
      .attr("refX", 13)
      .attr("refY", 0)
      .attr("markerWidth", 3)
      .attr("markerHeight", 3)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-2L4,0L0,2")
      .attr("fill", "#EC4899");

    // Create links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => {
        switch (d.type) {
          case "spouse":
            return "#EC4899";
          case "parent":
            return "#3B82F6";
          case "child":
            return "#10B981";
          default:
            return "#6B7280";
        }
      })
      .attr("stroke-width", (d) => (d.type === "spouse" ? 4 : 3))
      .attr("stroke-dasharray", (d) => (d.type === "spouse" ? "8,4" : null))
      .attr("marker-end", (d) => {
        switch (d.type) {
          case "spouse":
            return "url(#arrow-spouse)";
          case "parent":
            return "url(#arrow-parent)";
          case "child":
            return "url(#arrow-child)";
          default:
            return null;
        }
      })
      .attr("opacity", 0.8);

    // Create node groups
    const nodeGroup = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    // Add drag behavior
    nodeGroup.call(
      d3
        .drag<SVGGElement, TreeNode>()
        .on("start", (event, d) => {
          if (!event.active && newSimulation)
            newSimulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active && newSimulation) newSimulation.alphaTarget(0);
          if (!isSimulationRunning) {
            d.fx = null;
            d.fy = null;
          }
        })
    );

    // Add outer ring for generation indication
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.id === profile?.id ? 32 : 27))
      .attr("fill", "none")
      .attr("stroke", (d) => {
        const generation = d.generation || 0;
        if (generation < 0) return "#3B82F6"; // Parents - blue
        if (generation > 0) return "#10B981"; // Children - green
        return "#F59E0B"; // Same generation - amber
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.id === profile?.id ? "0" : "4,2"))
      .attr("opacity", 0.6);

    // Add main circles for nodes
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.id === profile?.id ? 28 : 23))
      .attr("fill", (d) => {
        // Use color from parsed data if available, otherwise use gender color
        const hasColors = d.colors && d.colors.length > 0;
        return hasColors && d.colors && d.colors[0]
          ? d.colors[0]
          : getGenderColor(d.gender);
      })
      .attr("stroke", (d) => (d.id === profile?.id ? "#F59E0B" : "#ffffff"))
      .attr("stroke-width", (d) => (d.id === profile?.id ? 4 : 3))
      .attr("filter", "url(#drop-shadow)");

    // Add parent color circles for inheritance display
    nodeGroup.each(function (d) {
      if (d.colors && d.colors.length > 1) {
        const parentColors = d.colors.slice(1, 3); // Take up to 2 parent colors
        const nodeElement = d3.select(this);
        const isCurrentUser = d.id === profile?.id;
        const radius = isCurrentUser ? 28 : 23;

        parentColors.forEach((color, index) => {
          if (color) {
            nodeElement
              .append("circle")
              .attr("r", 3)
              .attr("fill", color)
              .attr("stroke", "#ffffff")
              .attr("stroke-width", 1)
              .attr("cx", index === 0 ? -10 : 10)
              .attr("cy", -radius - 6)
              .attr("filter", "url(#drop-shadow)");
          }
        });
      }
    });

    // Add text labels (initials)
    nodeGroup
      .append("text")
      .text((d) => getInitials(d.name))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", (d) => (d.id === profile?.id ? "14px" : "12px"))
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

    // Add name labels below nodes
    nodeGroup
      .append("text")
      .text((d) =>
        d.name.length > 12 ? d.name.substring(0, 12) + "..." : d.name
      )
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.id === profile?.id ? "45px" : "40px"))
      .attr("fill", "#374151")
      .attr("font-size", "11px")
      .attr("font-weight", "medium")
      .style("pointer-events", "none");

    // Add generation indicators
    nodeGroup
      .append("text")
      .text((d) => {
        const gen = d.generation || 0;
        if (gen === 0) return "";
        return gen > 0 ? `+${gen}` : `${gen}`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.id === profile?.id ? "-40px" : "-35px"))
      .attr("fill", "#6B7280")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

    // Add click handlers
    nodeGroup.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      onMemberClick?.(d.id);
    });

    // Add hover effects
    nodeGroup
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .select("circle:last-of-type")
          .transition()
          .duration(200)
          .attr("r", d.id === profile?.id ? 32 : 27)
          .attr("stroke-width", 4);

        // Highlight connected links
        link.attr("opacity", (l) => {
          return l.source === d || l.target === d ? 1 : 0.3;
        });
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .select("circle:last-of-type")
          .transition()
          .duration(200)
          .attr("r", d.id === profile?.id ? 28 : 23)
          .attr("stroke-width", d.id === profile?.id ? 4 : 3);

        // Reset link opacity
        link.attr("opacity", 0.8);
      });

    // Update positions on simulation tick
    newSimulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup function
    return () => {
      newSimulation.stop();
    };
  }, [treeData, profile?.id, onMemberClick, isSimulationRunning]);

  const toggleSimulation = () => {
    if (simulation) {
      if (isSimulationRunning) {
        simulation.stop();
        setIsSimulationRunning(false);
      } else {
        simulation.restart();
        setIsSimulationRunning(true);
      }
    }
  };

  const resetSimulation = () => {
    if (simulation) {
      simulation.restart();
      setIsSimulationRunning(true);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading family force-directed view...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8 text-red-600">
          <p>Failed to load family force-directed view</p>
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
              <Network className="h-5 w-5 text-orange-600" />
              <span>Family Dynamic View</span>
              <Badge variant="outline">Dynamic</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Dynamic layout with automatic positioning and clustering
            </p>
          </div>
          <div className="flex items-center space-x-2 gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 ml-3">
                <Badge variant="outline">{memberCount} members</Badge>
                <Badge variant="outline">
                  {isSimulationRunning ? "Running" : "Paused"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <Button variant="outline" size="sm" onClick={toggleSimulation}>
                  {isSimulationRunning ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={resetSimulation}>
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
          <div
            ref={containerRef}
            className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              className="cursor-grab"
            >
              {/* This will be populated by D3 */}
            </svg>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              • <strong>Click nodes</strong> to view member details
            </p>
            <p>
              • <strong>Drag nodes</strong> to reposition them
            </p>
            <p>
              • <strong>Drag background</strong> to pan around the tree
            </p>
            <p>
              • <strong>Toggle simulation</strong> to start/stop automatic
              layout
            </p>
            <p>
              • <strong>Force-directed layout</strong> uses physics for optimal
              positioning
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
                        {selectedNode.generation === 0
                          ? "Same"
                          : selectedNode.generation > 0
                          ? `+${selectedNode.generation}`
                          : `${selectedNode.generation}`}
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
              <p>No family tree data available for force-directed view.</p>
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

// Helper functions
function getGenderColor(gender?: string): string {
  switch (gender) {
    case "MALE":
      return "#3B82F6"; // Blue
    case "FEMALE":
      return "#EC4899"; // Pink
    default:
      return "#6B7280"; // Gray
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
