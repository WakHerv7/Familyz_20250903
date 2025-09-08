import React, { RefObject } from "react";
import {
  PositionedNode,
  CoupleConnection,
  LineConnection,
  getGenderColor,
  getInitials,
} from "../utils/treeCalculations";

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface HierarchicalTreeCanvasProps {
  positionedNodes: PositionedNode[];
  couples: CoupleConnection[];
  lines: LineConnection[];
  viewBox: ViewBox;
  currentMemberId?: string;
  onMemberClick?: (memberId: string) => void;
  onMouseDown?: (event: React.MouseEvent) => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseUp?: (event: React.MouseEvent) => void;
  onWheel?: (event: React.WheelEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isPanning?: boolean;
  svgRef: RefObject<SVGSVGElement>;
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

export function HierarchicalTreeCanvas({
  positionedNodes,
  couples,
  lines,
  viewBox,
  currentMemberId,
  onMemberClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onMouseEnter,
  onMouseLeave,
  isPanning,
  svgRef,
}: HierarchicalTreeCanvasProps) {
  return (
    <div
      className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
      style={{
        // Prevent page scrolling when mouse is over this container
        overscrollBehavior: "none",
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={`cursor-${isPanning ? "grabbing" : "grab"}`}
        style={{
          touchAction: "none", // Prevent touch scrolling on mobile
          userSelect: "none", // Prevent text selection
          // Ensure SVG captures wheel events
          pointerEvents: "auto",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Definitions for gradients and markers */}
        <defs>
          {/* Drop shadow filter */}
          <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>

          {/* Arrow markers for connections - smaller size */}
          <marker
            id="arrow-parent"
            viewBox="0 -3 6 6"
            refX="18"
            refY="0"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,-3L6,0L0,3" fill="#6B7280" />
          </marker>

          <marker
            id="arrow-child"
            viewBox="0 -3 6 6"
            refX="18"
            refY="0"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,-3L6,0L0,3" fill="#10B981" />
          </marker>
        </defs>

        {/* Connection lines */}
        <g className="connections">
          {lines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={
                line.type === "parent"
                  ? "#3B82F6"
                  : line.type === "child"
                  ? "#10B981"
                  : "#6B7280"
              }
              strokeWidth="3"
              opacity="0.8"
              markerEnd={`url(#arrow-${line.type})`}
            />
          ))}
        </g>

        {/* Couple connections (dashed lines) */}
        <g className="couples">
          {couples.map((couple) => (
            <line
              key={couple.id}
              x1={couple.x1}
              y1={couple.y1}
              x2={couple.x2}
              y2={couple.y2}
              stroke="#EC4899"
              strokeWidth="4"
              strokeDasharray="8,4"
              opacity="0.8"
            />
          ))}
        </g>

        {/* Tree nodes */}
        <g className="nodes">
          {positionedNodes.map((node) => {
            // Parse color information from node name
            const { colors, cleanName } = parseColorInfo(node.name);
            const hasColors = colors.length > 0;

            return (
              <g
                key={node.id}
                className="node cursor-pointer"
                onClick={() => onMemberClick?.(node.id)}
              >
                {/* Outer ring for current member */}
                {node.id === currentMemberId && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="32"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    opacity="0.6"
                  />
                )}

                {/* Generation indicator ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.id === currentMemberId ? "27" : "22"}
                  fill="none"
                  stroke={
                    node.generation < 0
                      ? "#3B82F6"
                      : node.generation > 0
                      ? "#10B981"
                      : "#F59E0B"
                  }
                  strokeWidth="2"
                  opacity="0.6"
                />

                {/* Main node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.id === currentMemberId ? "23" : "18"}
                  fill={
                    hasColors && colors[0]
                      ? colors[0]
                      : getGenderColor(node.gender)
                  }
                  stroke={node.id === currentMemberId ? "#F59E0B" : "#ffffff"}
                  strokeWidth={node.id === currentMemberId ? "4" : "3"}
                  filter="url(#drop-shadow)"
                />

                {/* Color circles for inheritance display */}
                {hasColors && colors.length > 1 && (
                  <>
                    {/* Parent color circles - positioned around the main circle */}
                    {colors.slice(1, 3).map((color, index) => (
                      <circle
                        key={`parent-${index}`}
                        cx={node.x + (index === 0 ? -15 : 15)}
                        cy={node.y - (node.id === currentMemberId ? 28 : 23)}
                        r="4"
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth="1"
                        filter="url(#drop-shadow)"
                      />
                    ))}
                  </>
                )}

                {/* Node initials */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dy="0.35em"
                  fill="white"
                  fontSize={node.id === currentMemberId ? "14px" : "12px"}
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {getInitials(cleanName)}
                </text>

                {/* Node name label - use clean name without color codes */}
                <text
                  x={node.x}
                  y={node.y + (node.id === currentMemberId ? 35 : 30)}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="11px"
                  fontWeight="medium"
                  pointerEvents="none"
                >
                  {cleanName.length > 12
                    ? cleanName.substring(0, 12) + "..."
                    : cleanName}
                </text>

                {/* Generation indicator */}
                {node.generation !== 0 && (
                  <text
                    x={node.x}
                    y={node.y - (node.id === currentMemberId ? 35 : 30)}
                    textAnchor="middle"
                    fill="#6B7280"
                    fontSize="10px"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {node.generation > 0
                      ? `+${node.generation}`
                      : `${node.generation}`}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
