import * as d3 from "d3";
import { TreeNode, TreeLink } from "../types";

export const createHierarchicalLayout = (
  nodes: TreeNode[],
  links: TreeLink[],
  width: number,
  height: number
): void => {
  const generationGroups = d3.group(nodes, (d) => d.generation || 0);
  const generations = Array.from(generationGroups.keys()).sort((a, b) => a - b);

  const verticalSpacing = (height / (generations.length + 1)) * 1.25; // Make generations closer vertically

  // First pass: position nodes
  generations.forEach((gen, genIndex) => {
    const genNodes = generationGroups.get(gen) || [];
    const horizontalSpacing = (width / (genNodes.length + 1)) * 0.5; // Make nodes closer horizontally

    genNodes.forEach((node, nodeIndex) => {
      node.x = horizontalSpacing * (nodeIndex + 1);
      node.y = verticalSpacing * (genIndex + 1);
    });
  });

  // Calculate bounds of all nodes
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  nodes.forEach((node) => {
    minX = Math.min(minX, node.x!);
    maxX = Math.max(maxX, node.x!);
    minY = Math.min(minY, node.y!);
    maxY = Math.max(maxY, node.y!);
  });

  // Calculate tree dimensions
  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;

  // Center the tree in the viewport
  const centerX = width / 2;
  const centerY = height / 2;
  const treeCenterX = (minX + maxX) / 2;
  const treeCenterY = (minY + maxY) / 2;

  const offsetX = centerX - treeCenterX;
  const offsetY = centerY - treeCenterY;

  // Apply centering offset to all nodes
  nodes.forEach((node) => {
    node.x! += offsetX;
    node.y! += offsetY;
    node.fx = node.x;
    node.fy = node.y;
  });

  // Calculate appropriate zoom level based on tree size
  const padding = 100; // Padding around the tree
  const scaleX = (width - padding) / treeWidth;
  const scaleY = (height - padding) / treeHeight;
  const optimalScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

  // Apply zoom transform to center and fit the tree
  if (document.querySelector("svg")) {
    const svg = d3.select("svg");
    const g = svg.select(".main-group");

    // Calculate the transform to center and scale the tree
    const transform = d3.zoomIdentity
      .translate(centerX, centerY)
      .scale(optimalScale)
      .translate(-centerX, -centerY);

    g.attr("transform", transform.toString());
  }

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
};
