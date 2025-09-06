import * as d3 from "d3";
import { TreeNode, TreeLink } from "../types";
import { TREE_SPACING } from "../config/spacing";

export const createHierarchicalLayout = (
  nodes: TreeNode[],
  links: TreeLink[],
  width: number,
  height: number
): { offsetX: number; offsetY: number } => {
  // Use the positions that the backend has already calculated
  // The backend performs a proper BFS traversal and calculates positions based on family relationships

  // Group nodes by generation to find the largest generation for horizontal centering
  const generations = new Map<number, TreeNode[]>();
  nodes.forEach((node) => {
    const generation = node.generation || 0;
    if (!generations.has(generation)) {
      generations.set(generation, []);
    }
    generations.get(generation)!.push(node);
  });

  // Find the generation with the most members (largest generation)
  let largestGeneration = 0;
  let maxMembers = 0;
  generations.forEach((genNodes, gen) => {
    if (genNodes.length > maxMembers) {
      maxMembers = genNodes.length;
      largestGeneration = gen;
    }
  });

  console.log(
    `🎯 Largest generation found: Generation ${largestGeneration} with ${maxMembers} members`
  );

  // Calculate horizontal offset based on the largest generation
  let horizontalOffset = 0;

  // Calculate the center of the largest generation
  const largestGenNodes = generations.get(largestGeneration) || [];
  if (largestGenNodes.length > 0) {
    const genMinX = Math.min(...largestGenNodes.map((n) => n.x || 0));
    const genMaxX = Math.max(...largestGenNodes.map((n) => n.x || 0));
    const largestGenCenterX = (genMinX + genMaxX) / 2;

    // Calculate horizontal offset to center all generations around the largest generation's center
    const viewportCenterX = width / 2;
    horizontalOffset = viewportCenterX - largestGenCenterX;

    console.log(
      `📐 Largest generation center: ${largestGenCenterX.toFixed(
        1
      )}, Viewport center: ${viewportCenterX.toFixed(1)}`
    );
    console.log(
      `📏 Applying horizontal offset: ${horizontalOffset.toFixed(1)}`
    );

    // Apply horizontal centering to all nodes
    nodes.forEach((node) => {
      const backendX = node.x || 0;
      node.x = backendX + horizontalOffset;
    });
  }

  // Calculate vertical bounds for vertical centering
  let minY = Infinity,
    maxY = -Infinity;

  nodes.forEach((node) => {
    const backendY = node.y || 0;
    minY = Math.min(minY, backendY);
    maxY = Math.max(maxY, backendY);
  });

  // Calculate vertical centering offset
  const centerY = height / 2;
  const treeCenterY = (minY + maxY) / 2;
  const verticalOffset = centerY - treeCenterY;

  // Apply vertical centering offset to all nodes
  nodes.forEach((node) => {
    const backendY = node.y || 0;
    node.y = backendY + verticalOffset;

    // Set fixed positions for stability
    node.fx = node.x;
    node.fy = node.y;
  });

  // Resolve link references to actual node objects for proper positioning
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  links.forEach((link) => {
    if (typeof link.source === "string") {
      link.source = nodeMap.get(link.source) || link.source;
    }
    if (typeof link.target === "string") {
      link.target = nodeMap.get(link.target) || link.target;
    }
  });

  console.log("🎯 Hierarchical layout applied with generation-based centering");
  console.log(
    `📐 Tree vertical bounds: ${minY.toFixed(1)} to ${maxY.toFixed(1)}`
  );
  console.log(
    `📏 Applied generation-based horizontal centering with vertical offset: ${verticalOffset.toFixed(
      1
    )}`
  );

  return { offsetX: horizontalOffset, offsetY: verticalOffset };
};
