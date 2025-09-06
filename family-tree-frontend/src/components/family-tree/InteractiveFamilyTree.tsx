"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Loader2, Network } from "lucide-react";

// Import our modular components and utilities
import {
  TreeNode,
  TreeLink,
  InteractiveFamilyTreeProps,
  ViewMode,
} from "./types";
import {
  getInitials,
  getGenderColor,
  buildTreeData,
  buildFamilyTreeStructure,
  buildFamilyTreeFromApiData,
} from "./utils";
import { createHierarchicalLayout } from "./layouts";
import { useTreeZoom } from "./hooks";
import {
  FamilyTreeItem,
  TreeControls,
  TreeLegend,
  ExplorerView,
  VisualTreeView,
} from "./components";
import { TREE_SPACING } from "./config/spacing";
import SvgFamilyTree from "./SvgFamilyTree";
import FolderTreeView from "@/components/FolderTreeView";

// Import the new tree hooks
import {
  useFamilyTree,
  useLoadMemberRelationships,
  useFamilies,
} from "@/hooks/api";

export default function InteractiveFamilyTree({
  currentMember,
  onMemberClick,
}: InteractiveFamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("explorer");

  // Get user's families to determine the correct family ID
  const { data: userFamilies } = useFamilies();

  // Determine the family ID to use - prefer currentMember.familyId, then first available family
  const familyId = currentMember.familyId || userFamilies?.[0]?.id;

  // Use the new tree endpoint for better data fetching
  const {
    data: treeData,
    isLoading: treeLoading,
    error: treeError,
    refetch: refetchTree,
  } = useFamilyTree(familyId, currentMember.id, 2);

  // Lazy loading hook for deeper relationships
  const loadMemberRelationships = useLoadMemberRelationships();

  // Initialize expanded nodes based on tree data
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (treeData?.nodes?.length) {
      // Find the root ancestor (oldest generation)
      const rootNode = treeData.nodes.reduce((oldest, current) =>
        (current.generation || 0) < (oldest.generation || 0) ? current : oldest
      );
      console.log(
        "🎯 InteractiveFamilyTree: Initializing with root:",
        rootNode.name
      );
      console.log("📂 Expanded nodes initialized:", [rootNode.id]);
      return new Set([rootNode.id]);
    }
    return new Set();
  });

  // Reset expanded nodes when current member changes
  useEffect(() => {
    if (treeData?.nodes?.length) {
      // Find the root ancestor (oldest generation)
      const rootNode = treeData.nodes.reduce((oldest, current) =>
        (current.generation || 0) < (oldest.generation || 0) ? current : oldest
      );
      console.log("🔄 Member changed to:", currentMember.name);
      console.log("🌳 Resetting tree with new root:", rootNode.name);
      setExpandedNodes(new Set([rootNode.id]));
    }
  }, [currentMember.id, treeData]);

  // Use our custom zoom hook
  const {
    svgRef,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleFitToScreen,
    autoFitToScreen,
  } = useTreeZoom(containerRef);

  // Auto-fit to screen when tree data changes (for visual views only)
  // useEffect(() => {
  //   if (treeData?.nodes?.length && viewMode !== "explorer" && !treeLoading) {
  //     console.log("🔍 Auto-fitting tree to screen for optimal viewing...");
  //     autoFitToScreen();
  //   }
  // }, [treeData, viewMode, treeLoading, autoFitToScreen]);

  const downloadSVG = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "family-tree.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const toggleNodeExpansion = async (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(nodeId);
      if (wasExpanded) {
        newSet.delete(nodeId);
        console.log("📂 Collapsed node:", nodeId);
      } else {
        // Check if we need to load deeper relationships
        const node = treeData?.nodes?.find((n) => n.id === nodeId);
        if (node && !hasCompleteRelationships(nodeId)) {
          console.log("🔄 Loading deeper relationships for:", nodeId);
          loadMemberRelationships.mutate({
            memberId: nodeId,
            depth: 3,
          });
        }
        newSet.add(nodeId);
        console.log("📂 Expanded node:", nodeId);
      }
      console.log("📂 Current expanded nodes:", Array.from(newSet));
      return newSet;
    });
  };

  // Helper function to check if we have complete relationships for a node
  const hasCompleteRelationships = (nodeId: string): boolean => {
    // For now, assume we need to load deeper if the node has many potential relationships
    // This can be enhanced with metadata from the API
    return false; // Always load deeper for now to ensure complete data
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !treeData) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll("*").remove();

    // Use tree data from API instead of building from member profile
    const rawNodes = treeData.nodes || [];
    const rawConnections = treeData.connections || [];

    // Map backend nodes to frontend TreeNode format
    const nodes: TreeNode[] = rawNodes.map((node: any) => ({
      id: node.id,
      name: node.name,
      gender: node.gender,
      generation: node.level || 0, // Map backend 'level' to frontend 'generation'
      x: node.x || 0,
      y: node.y || 0,
      fx: null,
      fy: null,
    }));

    // Transform connections to D3-compatible links
    const rawLinks = rawConnections
      .map((connection: any) => {
        const sourceNode = nodes.find((n: any) => n.id === connection.from);
        const targetNode = nodes.find((n: any) => n.id === connection.to);

        if (!sourceNode || !targetNode) {
          console.warn("⚠️ Missing node for connection:", connection);
          return null;
        }

        return {
          source: sourceNode,
          target: targetNode,
          type: connection.type,
        };
      })
      .filter((link): link is NonNullable<typeof link> => link !== null); // Remove null entries

    const links: TreeLink[] = rawLinks as TreeLink[];

    console.log("🔗 Transformed links for D3:", links.length);

    if (nodes.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    // Create main group for zoom/pan
    const g = svg.append("g").attr("class", "main-group");

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Create force simulation or hierarchical layout
    let simulation: d3.Simulation<TreeNode, TreeLink> | null = null;

    if (viewMode === "hierarchical") {
      const layoutResult = createHierarchicalLayout(
        nodes,
        links,
        width,
        height
      );
      console.log("📐 Hierarchical layout result:", layoutResult);
    } else if (viewMode === "force") {
      // Initialize nodes with backend positions if available
      nodes.forEach((node) => {
        if (node.x === undefined || node.y === undefined) {
          // Fallback to random positioning if no backend coordinates
          node.x = Math.random() * width;
          node.y = Math.random() * height;
        }
      });

      simulation = d3
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
              return d.type === "spouse"
                ? TREE_SPACING.frontend.linkDistances.spouse
                : sameGeneration
                ? TREE_SPACING.frontend.linkDistances.sameGeneration
                : TREE_SPACING.frontend.linkDistances.differentGeneration;
            })
            .strength((d) => (d.type === "spouse" ? 0.8 : 0.6))
        )
        .force(
          "charge",
          d3
            .forceManyBody()
            .strength(TREE_SPACING.frontend.forceLayout.chargeStrength)
        )
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collision",
          d3.forceCollide().radius(TREE_SPACING.frontend.collisionRadius)
        )
        .force(
          "y",
          d3
            .forceY((d: TreeNode) => {
              const generation = d.generation || 0;
              return (
                height / 2 +
                generation * TREE_SPACING.frontend.forceLayout.verticalSpacing
              );
            })
            .strength(TREE_SPACING.frontend.forceLayout.verticalStrength)
        )
        .force(
          "x",
          d3
            .forceX((d: TreeNode) => {
              // Use backend x position as starting point
              return d.x || width / 2;
            })
            .strength(0.1)
        );
    }

    // Create gradient definitions for better visuals
    const defs = svg.append("defs");

    // Add drop shadow filter
    const filter = defs
      .append("filter")
      .attr("id", "drop-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter
      .append("feDropShadow")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("stdDeviation", 3)
      .attr("flood-opacity", 0.3);

    // Create markers for arrows
    defs
      .selectAll("marker")
      .data(["parent", "child"])
      .enter()
      .append("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6B7280");

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
      .attr("marker-end", (d) =>
        d.type !== "spouse" ? `url(#arrow-${d.type})` : null
      )
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

    // Add node drag behavior only for force layout
    if (viewMode === "force" && simulation) {
      nodeGroup.call(
        d3
          .drag<SVGGElement, TreeNode>()
          .on("start", (event, d) => {
            if (!event.active && simulation)
              simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active && simulation) simulation.alphaTarget(0);
            if (viewMode === "force") {
              d.fx = null;
              d.fy = null;
            }
          })
      );
    }

    // Add outer ring for generation indication
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.id === currentMember.id ? 32 : 27))
      .attr("fill", "none")
      .attr("stroke", (d) => {
        const generation = d.generation || 0;
        if (generation < 0) return "#3B82F6"; // Parents - blue
        if (generation > 0) return "#10B981"; // Children - green
        return "#F59E0B"; // Same generation - amber
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) =>
        d.id === currentMember.id ? "0" : "4,2"
      )
      .attr("opacity", 0.6);

    // Add main circles for nodes
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.id === currentMember.id ? 28 : 23))
      .attr("fill", (d) => getGenderColor(d.gender))
      .attr("stroke", (d) =>
        d.id === currentMember.id ? "#F59E0B" : "#ffffff"
      )
      .attr("stroke-width", (d) => (d.id === currentMember.id ? 4 : 3))
      .attr("filter", "url(#drop-shadow)");

    // Add text labels (initials)
    nodeGroup
      .append("text")
      .text((d) => getInitials(d.name))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", (d) => (d.id === currentMember.id ? "14px" : "12px"))
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

    // Add name labels below nodes
    nodeGroup
      .append("text")
      .text((d) =>
        d.name.length > 12 ? d.name.substring(0, 12) + "..." : d.name
      )
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.id === currentMember.id ? "45px" : "40px"))
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
      .attr("dy", (d) => (d.id === currentMember.id ? "-40px" : "-35px"))
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
          .attr("r", d.id === currentMember.id ? 32 : 27)
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
          .attr("r", d.id === currentMember.id ? 28 : 23)
          .attr("stroke-width", d.id === currentMember.id ? 4 : 3);

        // Reset link opacity
        link.attr("opacity", 0.8);
      });

    // Update positions on simulation tick (only for force layout)
    if (simulation) {
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => {
            const source =
              typeof d.source === "string"
                ? nodes.find((n) => n.id === d.source)
                : d.source;
            return source?.x || 0;
          })
          .attr("y1", (d: any) => {
            const source =
              typeof d.source === "string"
                ? nodes.find((n) => n.id === d.source)
                : d.source;
            return source?.y || 0;
          })
          .attr("x2", (d: any) => {
            const target =
              typeof d.target === "string"
                ? nodes.find((n) => n.id === d.target)
                : d.target;
            return target?.x || 0;
          })
          .attr("y2", (d: any) => {
            const target =
              typeof d.target === "string"
                ? nodes.find((n) => n.id === d.target)
                : d.target;
            return target?.y || 0;
          });

        nodeGroup.attr(
          "transform",
          (d: any) => `translate(${d.x || 0},${d.y || 0})`
        );
      });
    } else {
      // For hierarchical layout, set positions immediately
      link
        .attr("x1", (d: any) => {
          const source =
            typeof d.source === "string"
              ? nodes.find((n) => n.id === d.source)
              : d.source;
          return source?.x || 0;
        })
        .attr("y1", (d: any) => {
          const source =
            typeof d.source === "string"
              ? nodes.find((n) => n.id === d.source)
              : d.source;
          return source?.y || 0;
        })
        .attr("x2", (d: any) => {
          const target =
            typeof d.target === "string"
              ? nodes.find((n) => n.id === d.target)
              : d.target;
          return target?.x || 0;
        })
        .attr("y2", (d: any) => {
          const target =
            typeof d.target === "string"
              ? nodes.find((n) => n.id === d.target)
              : d.target;
          return target?.y || 0;
        });

      nodeGroup.attr(
        "transform",
        (d: any) => `translate(${d.x || 0},${d.y || 0})`
      );
    }

    // Cleanup function
    return () => {
      if (simulation) simulation.stop();
    };
  }, [currentMember, onMemberClick, viewMode, treeData]);

  // Use tree data from API
  const nodes = treeData?.nodes || [];
  const memberCount = treeData?.metadata?.totalMembers || nodes.length;

  return (
    <div className="w-full">
      {/* <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Interactive Family Tree</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{memberCount} members</Badge>
            {viewMode !== "explorer" && (
              <Badge variant="outline">
                Zoom: {Math.round(zoomLevel * 100)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader> */}
      <CardContent>
        <div className="space-y-4 w-full">
          {/* Controls */}
          <TreeControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            onFitToScreen={handleFitToScreen}
            onDownload={downloadSVG}
          />

          {/* Legend - only for visual modes */}
          {/* {viewMode !== "explorer" && (
            <div className="flex justify-end">
              <TreeLegend />
            </div>
          )} */}

          {/* Dynamic View Content */}
          {viewMode === "explorer" ? (
            <FolderTreeView
              currentMember={currentMember}
              onMemberClick={onMemberClick}
            />
          ) : // <ExplorerView
          //   treeData={treeData}
          //   treeLoading={treeLoading}
          //   treeError={treeError}
          //   refetchTree={refetchTree}
          //   familyId={familyId}
          //   nodes={nodes}
          //   onMemberClick={onMemberClick}
          //   currentMemberId={currentMember.id}
          //   expandedNodes={expandedNodes}
          //   toggleNodeExpansion={toggleNodeExpansion}
          // />
          viewMode === "folder" ? (
            /* Folder Tree View */
            <FolderTreeView
              currentMember={currentMember}
              onMemberClick={onMemberClick}
            />
          ) : viewMode === "svg" ? (
            /* SVG Tree View */
            <SvgFamilyTree
              currentMember={currentMember}
              onMemberClick={onMemberClick}
              treeData={treeData}
              isLoading={treeLoading}
              error={treeError}
            />
          ) : (
            <VisualTreeView
              viewMode={viewMode}
              containerRef={containerRef}
              svgRef={svgRef}
            />
          )}

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
                      {getInitials(selectedNode.name)}
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
                          : selectedNode.generation! > 0
                          ? `+${selectedNode.generation}`
                          : `${selectedNode.generation}`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State for Visual Views */}
          {treeLoading && viewMode !== "explorer" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading family tree visualization...</span>
            </div>
          )}

          {/* Error State for Visual Views */}
          {treeError && viewMode !== "explorer" && (
            <div className="text-center py-8 text-red-600">
              <p>Failed to load family tree visualization</p>
              <p className="text-sm text-gray-500 mt-1">
                {treeError.message || "Please try again later"}
              </p>
              <Button
                onClick={() => refetchTree()}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!treeLoading && !treeError && nodes.length <= 1 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No family relationships to visualize yet.</p>
              <p className="text-sm">
                Add family members and relationships to see the interactive
                tree.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}
