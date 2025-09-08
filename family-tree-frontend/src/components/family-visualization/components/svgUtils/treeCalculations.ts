import { TreeNode } from "../../../../types";
import { CONFIG } from "./constants";

export interface PositionedNode extends TreeNode {
  x: number;
  y: number;
  radius: number;
  generation: number;
}

export interface CoupleConnection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  xmid: number;
  ymid: number;
}

export interface LineConnection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TreeCalculationResult {
  positionedNodes: PositionedNode[];
  couples: CoupleConnection[];
  lines: LineConnection[];
}

/**
 * Calculate positions for all family tree nodes
 */
export function calculateTreePositions(
  nodes: TreeNode[],
  connections: any[]
): TreeCalculationResult {
  console.log(
    "SVG Tree - Processing",
    nodes.length,
    "nodes and",
    connections.length,
    "connections"
  );

  // Group by existing generation values (from backend 'level'), fallback to basic layout
  const generations: { [key: number]: TreeNode[] } = {};

  nodes.forEach((node) => {
    // Backend sends generation as 'level', not 'generation'
    const gen = node.level || 0;
    if (!generations[gen]) generations[gen] = [];
    generations[gen].push(node);
    console.log(
      `Node ${node.name}: backend level=${node.level}, using gen=${gen}`
    );
  });

  console.log("SVG Tree - Generations found:", Object.keys(generations));

  // Calculate positions with guaranteed visibility
  const positionedNodes: PositionedNode[] = [];
  const couples: CoupleConnection[] = [];
  const lines: LineConnection[] = [];

  const genKeys = Object.keys(generations)
    .map(Number)
    .sort((a, b) => a - b);
  let currentY = 100; // Start from visible area

  genKeys.forEach((gen, genIndex) => {
    const genNodes = generations[gen];
    const genWidth = Math.max(genNodes.length * CONFIG.gap_h, 800);
    const startX = -genWidth / 2; // Center horizontally

    genNodes.forEach((node, nodeIndex) => {
      const positionedNode: PositionedNode = {
        ...node,
        x: startX + nodeIndex * CONFIG.gap_h,
        y: currentY,
        radius: CONFIG.radius,
        generation: gen,
      };
      positionedNodes.push(positionedNode);
      console.log(
        `👤 MEMBER COORDINATES - ${node.name}: (${positionedNode.x}, ${positionedNode.y}) | Generation: ${gen} | Index: ${nodeIndex}`
      );
    });

    // Check if next generation contains spouses of current generation
    const nextGenKey = genKeys[genIndex + 1];
    let isNextGenSpouse = false;

    if (nextGenKey !== undefined) {
      const nextGenNodes = generations[nextGenKey];
      // Check if any node in next generation is a spouse of current generation
      isNextGenSpouse = nextGenNodes.some((nextNode) =>
        connections.some(
          (conn) =>
            conn.type === "spouse" &&
            ((conn.from === nextNode.id &&
              genNodes.some((currNode) => currNode.id === conn.to)) ||
              (conn.to === nextNode.id &&
                genNodes.some((currNode) => currNode.id === conn.from)))
        )
      );
    }

    // Use smaller gap for spouses, normal gap for other generations
    currentY += isNextGenSpouse ? CONFIG.gap_v * 0.5 : CONFIG.gap_v;
  });

  console.log("SVG Tree - Positioned", positionedNodes.length, "nodes");

  // Create connections
  connections.forEach((conn: any) => {
    if (conn.type === "spouse") {
      const sourceNode = positionedNodes.find((n) => n.id === conn.from);
      const targetNode = positionedNodes.find((n) => n.id === conn.to);

      if (sourceNode && targetNode) {
        couples.push({
          id: `couple_${sourceNode.id}_${targetNode.id}`,
          x1: sourceNode.x,
          y1: sourceNode.y,
          x2: targetNode.x,
          y2: targetNode.y,
          xmid: (sourceNode.x + targetNode.x) / 2,
          ymid: sourceNode.y + CONFIG.radius * 0.3, // Position spouse connection closer to the node
        });
      }
    } else if (conn.type === "parent" || conn.type === "child") {
      const sourceNode = positionedNodes.find((n) => n.id === conn.from);
      const targetNode = positionedNodes.find((n) => n.id === conn.to);

      if (sourceNode && targetNode) {
        lines.push({
          id: `line_${sourceNode.id}_${targetNode.id}`,
          x1: sourceNode.x,
          y1: sourceNode.y,
          x2: targetNode.x,
          y2: targetNode.y,
        });
      }
    }
  });

  console.log(
    "SVG Tree - Created",
    couples.length,
    "couples and",
    lines.length,
    "lines"
  );

  return {
    positionedNodes,
    couples,
    lines,
  };
}

/**
 * Calculate the optimal viewBox for the tree
 */
export function calculateViewBox(positionedNodes: PositionedNode[]) {
  if (positionedNodes.length === 0) {
    return { x: -300, y: 0, w: 1000, h: 800 };
  }

  const minX = Math.min(...positionedNodes.map((n) => n.x)) - 150;
  const maxX = Math.max(...positionedNodes.map((n) => n.x)) + 150;
  const minY = Math.min(...positionedNodes.map((n) => n.y)) - 150;
  const maxY = Math.max(...positionedNodes.map((n) => n.y)) + 150;

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
}
