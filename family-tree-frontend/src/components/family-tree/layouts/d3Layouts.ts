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

  // Calculate bounds of all nodes using backend-calculated positions
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  nodes.forEach((node) => {
    // Backend already provides x, y coordinates, but they might need scaling
    const backendX = node.x || 0;
    const backendY = node.y || 0;

    minX = Math.min(minX, backendX);
    maxX = Math.max(maxX, backendX);
    minY = Math.min(minY, backendY);
    maxY = Math.max(maxY, backendY);
  });

  // Calculate tree dimensions
  const treeWidth = maxX - minX || width;
  const treeHeight = maxY - minY || height;

  // For hierarchical layout, preserve the backend spacing but center the tree
  // Don't apply scaling that would reduce the spacing
  const centerX = width / 2;
  const centerY = height / 2;
  const treeCenterX = (minX + maxX) / 2;
  const treeCenterY = (minY + maxY) / 2;

  // Calculate offset to center the tree without scaling
  const offsetX = centerX - treeCenterX;
  const offsetY = centerY - treeCenterY;

  // Apply centering offset to all nodes (preserve backend spacing)
  nodes.forEach((node) => {
    const backendX = node.x || 0;
    const backendY = node.y || 0;

    // Center the tree by applying offset (no scaling to preserve spacing)
    node.x = backendX + offsetX;
    node.y = backendY + offsetY;

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

  console.log("🎯 Hierarchical layout applied using backend positions");
  console.log(`📐 Tree bounds: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
  console.log(
    `📏 Preserved doubled backend spacing with centering offset: (${offsetX.toFixed(
      1
    )}, ${offsetY.toFixed(1)})`
  );

  return { offsetX, offsetY };
};
