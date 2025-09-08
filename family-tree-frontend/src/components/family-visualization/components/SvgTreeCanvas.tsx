import React, { useRef, useEffect } from "react";
import {
  PositionedNode,
  CoupleConnection,
  LineConnection,
} from "../../family-tree/svg-tree/utils/treeCalculations";
import {
  createSvgDefs,
  createSvgGroups,
  renderCouples,
  renderLines,
  renderNodes,
} from "../../family-tree/svg-tree/utils/svgRendering";

interface SvgTreeCanvasProps {
  positionedNodes: PositionedNode[];
  couples: CoupleConnection[];
  lines: LineConnection[];
  viewBox: { x: number; y: number; w: number; h: number };
  currentMemberId: string;
  onMemberClick?: (id: string) => void;
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: (event: React.MouseEvent) => void;
  onWheel: (event: React.WheelEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isPanning: boolean;
  svgRef: React.RefObject<SVGSVGElement>;
}

export const SvgTreeCanvas: React.FC<SvgTreeCanvasProps> = ({
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
}) => {
  // Render SVG elements when data changes
  useEffect(() => {
    if (!svgRef.current || !positionedNodes.length) return;

    const svg = svgRef.current;

    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Create SVG structure
    createSvgDefs(svg);
    const { couplesGroup, linesGroup, circlesGroup, textsGroup } =
      createSvgGroups(svg);

    // Render all elements
    renderCouples(couples, couplesGroup);
    renderLines(lines, linesGroup);
    renderNodes(
      positionedNodes,
      circlesGroup,
      textsGroup,
      currentMemberId,
      onMemberClick
    );

    console.log("SVG Tree - Rendered", positionedNodes.length, "nodes");
  }, [positionedNodes, couples, lines, currentMemberId, onMemberClick]);

  return (
    <div
      className="w-full border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50"
      style={{
        height: "600px",
        cursor: isPanning ? "grabbing" : "grab",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        style={{
          background: "linear-gradient(135deg, #0c0033, #005318)",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
        onWheel={onWheel}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
};
