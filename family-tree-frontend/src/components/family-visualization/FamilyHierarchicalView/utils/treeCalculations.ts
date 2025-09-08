// Tree calculation utilities for family visualization

export interface PositionedNode {
  id: string;
  name: string;
  gender: string;
  x: number;
  y: number;
  generation: number;
  level?: number;
  parents?: string[];
  children?: string[];
  spouses?: string[];
}

export interface CoupleConnection {
  id: string;
  member1Id: string;
  member2Id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineConnection {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "parent" | "child" | "spouse";
}

export interface TreeNode {
  id: string;
  name: string;
  gender: string;
  generation: number;
  level?: number;
  parents?: string[];
  children?: string[];
  spouses?: string[];
}

export interface TreeConnection {
  id: string;
  from: string;
  to: string;
  type: "parent" | "child" | "spouse";
}

// Calculate positions for tree nodes
export function calculateTreePositions(
  nodes: TreeNode[],
  connections: TreeConnection[] = []
): {
  positionedNodes: PositionedNode[];
  couples: CoupleConnection[];
  lines: LineConnection[];
} {
  const positionedNodes: PositionedNode[] = [];
  const couples: CoupleConnection[] = [];
  const lines: LineConnection[] = [];

  if (!nodes.length) {
    return { positionedNodes, couples, lines };
  }

  // Group nodes by generation
  const nodesByGeneration: { [key: number]: TreeNode[] } = {};
  nodes.forEach((node) => {
    const generation = node.generation || node.level || 0;
    if (!nodesByGeneration[generation]) {
      nodesByGeneration[generation] = [];
    }
    nodesByGeneration[generation].push(node);
  });

  // Calculate positions
  const generations = Object.keys(nodesByGeneration)
    .map(Number)
    .sort((a, b) => a - b);
  const nodeSpacing = 150;
  const generationSpacing = 120;

  // First pass: calculate initial positions
  const tempNodes: PositionedNode[] = [];
  generations.forEach((generation, genIndex) => {
    const genNodes = nodesByGeneration[generation];
    const startY = genIndex * generationSpacing;

    genNodes.forEach((node, nodeIndex) => {
      const startX = (nodeIndex - genNodes.length / 2) * nodeSpacing;

      const positionedNode: PositionedNode = {
        id: node.id,
        name: node.name,
        gender: node.gender,
        x: startX,
        y: startY,
        generation: generation,
        level: node.level,
        parents: node.parents,
        children: node.children,
        spouses: node.spouses,
      };

      tempNodes.push(positionedNode);
    });
  });

  // Second pass: center the entire tree around (0,0)
  if (tempNodes.length > 0) {
    const minX = Math.min(...tempNodes.map((n) => n.x));
    const maxX = Math.max(...tempNodes.map((n) => n.x));
    const minY = Math.min(...tempNodes.map((n) => n.y));
    const maxY = Math.max(...tempNodes.map((n) => n.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Offset all nodes to center the tree at (0,0)
    tempNodes.forEach((node) => {
      node.x -= centerX;
      node.y -= centerY;
    });
  }

  positionedNodes.push(...tempNodes);

  // Create connections
  connections.forEach((connection, index) => {
    const fromNode = positionedNodes.find((n) => n.id === connection.from);
    const toNode = positionedNodes.find((n) => n.id === connection.to);

    if (fromNode && toNode) {
      if (connection.type === "spouse") {
        // Create couple connection
        const couple: CoupleConnection = {
          id: `couple-${connection.from}-${connection.to}-${index}`,
          member1Id: connection.from,
          member2Id: connection.to,
          x1: fromNode.x,
          y1: fromNode.y,
          x2: toNode.x,
          y2: toNode.y,
        };
        couples.push(couple);
      } else {
        // Create line connection
        const line: LineConnection = {
          id: `line-${connection.type}-${connection.from}-${connection.to}-${index}`,
          fromId: connection.from,
          toId: connection.to,
          x1: fromNode.x,
          y1: fromNode.y,
          x2: toNode.x,
          y2: toNode.y,
          type: connection.type,
        };
        lines.push(line);
      }
    }
  });

  return { positionedNodes, couples, lines };
}

// Calculate optimal viewBox for the tree
export function calculateViewBox(nodes: PositionedNode[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (!nodes.length) {
    return { x: -400, y: -300, w: 800, h: 600 };
  }

  // Since tree is now centered at (0,0), calculate symmetric bounds
  const maxAbsX = Math.max(...nodes.map((n) => Math.abs(n.x)));
  const maxAbsY = Math.max(...nodes.map((n) => Math.abs(n.y)));

  // Add padding around the tree
  const padding = 120;
  const halfWidth = maxAbsX + padding;
  const halfHeight = maxAbsY + padding;

  return {
    x: -halfWidth,
    y: -halfHeight,
    w: halfWidth * 2,
    h: halfHeight * 2,
  };
}

// Get gender color for nodes
export function getGenderColor(gender?: string): string {
  switch (gender) {
    case "MALE":
      return "#3B82F6"; // Blue
    case "FEMALE":
      return "#EC4899"; // Pink
    default:
      return "#6B7280"; // Gray
  }
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
