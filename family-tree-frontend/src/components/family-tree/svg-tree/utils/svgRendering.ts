import {
  PositionedNode,
  CoupleConnection,
  LineConnection,
} from "./treeCalculations";
import { CONFIG, toRadians } from "./constants";
import { getGenderColor } from "../../utils";

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

  // Add arrowhead marker for connection lines
  const arrowhead = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker"
  );
  arrowhead.setAttribute("id", "arrowhead");
  arrowhead.setAttribute("viewBox", "0 0 10 10");
  arrowhead.setAttribute("refX", "9");
  arrowhead.setAttribute("refY", "3");
  arrowhead.setAttribute("markerWidth", "6");
  arrowhead.setAttribute("markerHeight", "6");
  arrowhead.setAttribute("orient", "auto");

  const arrowPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  arrowPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  arrowPath.setAttribute("fill", "#ffeb3b97");
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
  lines.forEach((line) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // Calculate if this is a vertical connection (different generations)
    const isVertical = Math.abs(line.y2 - line.y1) > CONFIG.gap_v * 0.5;

    if (isVertical) {
      // For vertical connections between generations, create a smooth S-curve
      const midY = (line.y1 + line.y2) / 2;
      const controlOffset = Math.abs(line.x2 - line.x1) * 0.5 + 50; // Adaptive control point

      // Create S-curve for vertical connections
      const pathD = `M${line.x1},${line.y1}
                   C${line.x1},${line.y1 + controlOffset}
                    ${line.x2},${line.y2 - controlOffset}
                    ${line.x2},${line.y2}`;

      path.setAttribute("d", pathD);
    } else {
      // For horizontal connections (same generation), create simple curve
      const midX = (line.x1 + line.x2) / 2;
      const controlY = line.y1 - 30; // Curve upward

      const pathD = `M${line.x1},${line.y1}
                   Q${midX},${controlY}
                    ${line.x2},${line.y2}`;

      path.setAttribute("d", pathD);
    }

    path.setAttribute("stroke", "#ffeb3b97");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", "url(#arrowhead)");
    linesGroup.appendChild(path);
  });
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
    // Circle
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", node.x.toString());
    circle.setAttribute("cy", node.y.toString());
    circle.setAttribute("r", CONFIG.radius.toString());
    circle.setAttribute("fill", getGenderColor(node.gender) || "#64748b");
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

    // Inner text (initials)
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
    text.textContent = node.name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    textGroup.appendChild(text);
    textsGroup.appendChild(textGroup);

    // Name label below
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
      node.name.length > 15 ? node.name.substring(0, 15) + "..." : node.name;

    textsGroup.appendChild(nameText);
  });
}
