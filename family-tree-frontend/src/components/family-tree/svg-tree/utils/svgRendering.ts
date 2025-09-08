import {
  PositionedNode,
  CoupleConnection,
  LineConnection,
} from "./treeCalculations";
import { CONFIG, toRadians } from "./constants";
import { getGenderColor } from "../../utils/helpers";

/**
 * Create SVG defs element with filters and markers
 */
export function createSvgDefs(svg: SVGSVGElement): void {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.appendChild(defs);

  // Add drop shadow filter
  const filter = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "filter"
  );
  filter.setAttribute("id", "drop-shadow");
  filter.setAttribute("x", "-50%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "200%");
  filter.setAttribute("height", "200%");

  const feDropShadow = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feDropShadow"
  );
  feDropShadow.setAttribute("dx", "2");
  feDropShadow.setAttribute("dy", "2");
  feDropShadow.setAttribute("stdDeviation", "3");
  feDropShadow.setAttribute("flood-opacity", "0.3");
  filter.appendChild(feDropShadow);
  defs.appendChild(filter);

  // Add arrowhead marker for connection lines - small and visible
  const arrowhead = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker"
  );
  arrowhead.setAttribute("id", "arrowhead");
  arrowhead.setAttribute("viewBox", "0 0 8 8");
  arrowhead.setAttribute("refX", "7");
  arrowhead.setAttribute("refY", "4");
  arrowhead.setAttribute("markerWidth", "6");
  arrowhead.setAttribute("markerHeight", "6");
  arrowhead.setAttribute("orient", "auto");

  const arrowPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  arrowPath.setAttribute("d", "M 0 0 L 8 4 L 0 8 z");
  arrowPath.setAttribute("fill", "#fbbf24");
  arrowPath.setAttribute("stroke", "#f59e0b");
  arrowPath.setAttribute("stroke-width", "0.5");
  arrowhead.appendChild(arrowPath);
  defs.appendChild(arrowhead);
}

/**
 * Create SVG groups for different elements
 */
export function createSvgGroups(svg: SVGSVGElement): {
  couplesGroup: SVGGElement;
  linesGroup: SVGGElement;
  circlesGroup: SVGGElement;
  textsGroup: SVGGElement;
} {
  const couplesGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  couplesGroup.setAttribute("id", "couples");
  svg.appendChild(couplesGroup);

  const linesGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  linesGroup.setAttribute("id", "lines");
  svg.appendChild(linesGroup);

  const circlesGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  circlesGroup.setAttribute("id", "circles");
  svg.appendChild(circlesGroup);

  const textsGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  textsGroup.setAttribute("id", "texts");
  svg.appendChild(textsGroup);

  return { couplesGroup, linesGroup, circlesGroup, textsGroup };
}

/**
 * Render couple connections
 */
export function renderCouples(
  couples: CoupleConnection[],
  couplesGroup: SVGGElement
): void {
  couples.forEach((couple) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const rad = CONFIG.radius + CONFIG.extraRadiusWidth;
    const dx = couple.x2 - couple.x1;
    const dy = couple.y2 - couple.y1;
    const alpha = Math.atan(dx / dy);
    const beta = toRadians(180) - (alpha + toRadians(90));

    const pathD = `M${couple.x1 + rad * Math.sin(beta)},${
      couple.y1 - rad * Math.cos(beta)
    }
                 L${couple.x2 + rad * Math.sin(beta)},${
      couple.y2 - rad * Math.cos(beta)
    }
                 A30,30 0 0,1 ${couple.x2 - rad * Math.sin(beta)},${
      couple.y2 + rad * Math.cos(beta)
    }
                 L${couple.x1 - rad * Math.sin(beta)},${
      couple.y1 + rad * Math.cos(beta)
    }
                 A30,30 0 0,1 ${couple.x1 + rad * Math.sin(beta)},${
      couple.y1 - rad * Math.cos(beta)
    }`;

    path.setAttribute("d", pathD);
    path.setAttribute("stroke", "#ffffff99");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    couplesGroup.appendChild(path);
  });
}

/**
 * Render line connections (parent-child relationships)
 */
export function renderLines(
  lines: LineConnection[],
  linesGroup: SVGGElement
): void {
  lines.forEach((line, index) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // Calculate distance and angle between points
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Calculate if this is a vertical connection (different generations)
    const isVertical = Math.abs(dy) > CONFIG.gap_v * 0.3;

    if (isVertical) {
      // For vertical connections, create dynamic multi-point curves
      const midY = (line.y1 + line.y2) / 2;

      // Create more organic curves based on distance and position
      if (Math.abs(dx) < 50) {
        // Nearly vertical - create gentle S-curve
        const controlOffset = Math.min(distance * 0.3, 150);
        const pathD = `M${line.x1},${line.y1}
                     C${line.x1 + Math.sin(angle) * 30},${
          line.y1 + controlOffset * 0.5
        }
                      ${line.x2 - Math.sin(angle) * 30},${
          line.y2 - controlOffset * 0.5
        }
                      ${line.x2},${line.y2}`;
        path.setAttribute("d", pathD);
      } else {
        // Diagonal connection - create flowing curve with multiple control points
        const cp1x =
          line.x1 + dx * 0.3 + Math.sin(angle + Math.PI / 2) * (distance * 0.2);
        const cp1y =
          line.y1 + dy * 0.3 + Math.cos(angle + Math.PI / 2) * (distance * 0.2);
        const cp2x =
          line.x1 +
          dx * 0.7 +
          Math.sin(angle - Math.PI / 2) * (distance * 0.15);
        const cp2y =
          line.y1 +
          dy * 0.7 +
          Math.cos(angle - Math.PI / 2) * (distance * 0.15);

        const pathD = `M${line.x1},${line.y1}
                     C${cp1x},${cp1y}
                      ${cp2x},${cp2y}
                      ${line.x2},${line.y2}`;
        path.setAttribute("d", pathD);
      }
    } else {
      // For horizontal connections (same generation), create varied curves
      const midX = (line.x1 + line.x2) / 2;

      // Add variation based on horizontal distance
      if (Math.abs(dx) > CONFIG.gap_h * 2) {
        // Long horizontal connection - create elegant arc
        const arcHeight = Math.min(Math.abs(dx) * 0.15, 80);
        const controlY = line.y1 - arcHeight * (dy >= 0 ? 1 : -1);

        const pathD = `M${line.x1},${line.y1}
                     Q${midX},${controlY}
                      ${line.x2},${line.y2}`;
        path.setAttribute("d", pathD);
      } else {
        // Short horizontal connection - create subtle curve
        const curveOffset = Math.abs(dx) * 0.2 + 15;
        const controlY =
          line.y1 - curveOffset * (Math.sin(index * 0.5) * 0.5 + 0.5);

        const pathD = `M${line.x1},${line.y1}
                     Q${midX},${controlY}
                      ${line.x2},${line.y2}`;
        path.setAttribute("d", pathD);
      }
    }

    path.setAttribute("stroke", "#ffeb3b97");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", "url(#arrowhead)");
    linesGroup.appendChild(path);
  });
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

/**
 * Render family member nodes (circles and text)
 */
export function renderNodes(
  nodes: PositionedNode[],
  circlesGroup: SVGGElement,
  textsGroup: SVGGElement,
  currentMemberId: string,
  onMemberClick?: (id: string) => void
): void {
  nodes.forEach((node) => {
    // Parse color information from node name
    const { colors, cleanName } = parseColorInfo(node.name);
    const hasColors = colors.length > 0;

    // Main Circle
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", node.x.toString());
    circle.setAttribute("cy", node.y.toString());
    circle.setAttribute("r", CONFIG.radius.toString());
    circle.setAttribute(
      "fill",
      hasColors && colors[0]
        ? colors[0]
        : getGenderColor(node.gender) || "#64748b"
    );
    circle.setAttribute(
      "stroke",
      node.id === currentMemberId ? "#F59E0B" : "#ffffff"
    );
    circle.setAttribute(
      "stroke-width",
      node.id === currentMemberId ? "4" : "3"
    );
    circle.setAttribute("filter", "url(#drop-shadow)");
    circle.style.cursor = "pointer";

    circle.addEventListener("click", () => {
      onMemberClick?.(node.id);
    });

    circlesGroup.appendChild(circle);

    // Color circles for inheritance display (parent colors)
    if (hasColors && colors.length > 1) {
      colors.slice(1, 3).forEach((color, index) => {
        const parentCircle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        parentCircle.setAttribute(
          "cx",
          (node.x + (index === 0 ? -12 : 12)).toString()
        );
        parentCircle.setAttribute(
          "cy",
          (node.y - CONFIG.radius - 8).toString()
        );
        parentCircle.setAttribute("r", "3");
        parentCircle.setAttribute("fill", color);
        parentCircle.setAttribute("stroke", "#ffffff");
        parentCircle.setAttribute("stroke-width", "1");
        parentCircle.setAttribute("filter", "url(#drop-shadow)");
        circlesGroup.appendChild(parentCircle);
      });
    }

    // Generation number above the node
    const displayGen = (node as any).level || node.generation || 0;
    if (displayGen !== 0) {
      const genText = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      genText.setAttribute("x", node.x.toString());
      genText.setAttribute("y", (node.y - CONFIG.radius - 15).toString());
      genText.setAttribute("text-anchor", "middle");
      genText.setAttribute("fill", "white");
      genText.setAttribute(
        "font-size",
        CONFIG.fontSize.generation.toString() + "px"
      );
      genText.setAttribute("font-weight", "bold");
      genText.setAttribute("pointer-events", "none");
      genText.setAttribute("user-select", "none");
      genText.style.userSelect = "none";
      genText.textContent =
        displayGen > 0 ? `+${displayGen}` : displayGen.toString();

      textsGroup.appendChild(genText);
    }

    // Inner text (initials) - use clean name
    const textGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x.toString());
    text.setAttribute("y", node.y.toString());
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dy", "0.35em");
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", CONFIG.fontSize.initials.toString() + "px");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("pointer-events", "none");
    text.setAttribute("user-select", "none");
    text.style.userSelect = "none";
    text.textContent = cleanName
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    textGroup.appendChild(text);
    textsGroup.appendChild(textGroup);

    // Name label below - use clean name
    const nameText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    nameText.setAttribute("x", node.x.toString());
    nameText.setAttribute("y", (node.y + CONFIG.radius + 25).toString());
    nameText.setAttribute("text-anchor", "middle");
    nameText.setAttribute("fill", "white");
    nameText.setAttribute("font-size", CONFIG.fontSize.name.toString() + "px");
    nameText.setAttribute("font-weight", "medium");
    nameText.setAttribute("pointer-events", "none");
    nameText.setAttribute("user-select", "none");
    nameText.style.userSelect = "none";
    nameText.textContent =
      cleanName.length > 15 ? cleanName.substring(0, 15) + "..." : cleanName;

    textsGroup.appendChild(nameText);
  });
}
