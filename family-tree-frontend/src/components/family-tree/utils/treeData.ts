import { TreeNode, TreeLink, FamilyTreeNode } from "../types";
import { calculateGenerations } from "./helpers";

export const buildTreeData = (member: any) => {
  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];
  const processedMembers = new Set<string>();
  const generations = calculateGenerations(member);

  const addMember = (m: Partial<any>) => {
    if (!m.id || processedMembers.has(m.id)) return;

    processedMembers.add(m.id);
    nodes.push({
      id: m.id,
      name: m.name || "Unknown",
      gender: m.gender,
      generation: generations.get(m.id) || 0,
    });
  };

  // Add current member first
  addMember(member);

  // Add all related members
  member.parents?.forEach((parent: any) => {
    addMember(parent);
    links.push({
      source: parent.id,
      target: member.id,
      type: "parent",
    });
  });

  member.spouses?.forEach((spouse: any) => {
    addMember(spouse);
    links.push({
      source: member.id,
      target: spouse.id,
      type: "spouse",
    });
  });

  member.children?.forEach((child: any) => {
    addMember(child);
    links.push({
      source: member.id,
      target: child.id,
      type: "child",
    });
  });

  return { nodes, links };
};

export const findRootAncestor = (member: any): any => {
  const generations = calculateGenerations(member);
  let current = member;
  let oldestGeneration = generations.get(member.id) || 0;

  // Find the member with the oldest (most negative) generation
  const findOldest = (m: any) => {
    const gen = generations.get(m.id) || 0;
    if (gen < oldestGeneration) {
      oldestGeneration = gen;
      current = m;
    }

    // Recursively check parents
    m.parents?.forEach((parent: any) => findOldest(parent));
  };

  findOldest(member);
  return current;
};

export const buildFamilyTreeStructure = (member: any): FamilyTreeNode => {
  // Start from the root ancestor for explorer view
  const rootMember = findRootAncestor(member);
  const generations = calculateGenerations(member);
  const processedMembers = new Set<string>();

  // Build a complete relationship map from all available data
  const relationshipMap = new Map<string, any>();

  // Helper function to collect all relationships
  const collectRelationships = (m: any) => {
    if (!m.id || relationshipMap.has(m.id)) return;

    relationshipMap.set(m.id, m);

    // Collect relationships from this member
    m.parents?.forEach((parent: any) => collectRelationships(parent));
    m.spouses?.forEach((spouse: any) => collectRelationships(spouse));
    m.children?.forEach((child: any) => collectRelationships(child));
  };

  // Collect all relationships starting from the original member
  collectRelationships(member);

  console.log("🔍 Family Tree Builder Debug:");
  console.log("📊 Total relationships collected:", relationshipMap.size);
  console.log("👤 Original member:", member.name, "(ID:", member.id + ")");
  console.log(
    "👴 Root ancestor:",
    rootMember.name,
    "(ID:",
    rootMember.id + ")"
  );

  // Show root ancestor's relationships from the complete map
  const rootData = relationshipMap.get(rootMember.id);
  if (rootData) {
    console.log("👨‍👩‍👧‍👦 Root ancestor relationships:");
    console.log(
      "  - Children:",
      rootData.children?.length || 0,
      rootData.children?.map((c: any) => c.name).join(", ") || "none"
    );
    console.log(
      "  - Spouses:",
      rootData.spouses?.length || 0,
      rootData.spouses?.map((s: any) => s.name).join(", ") || "none"
    );
    console.log(
      "  - Parents:",
      rootData.parents?.length || 0,
      rootData.parents?.map((p: any) => p.name).join(", ") || "none"
    );
  }

  const buildNode = (m: any): FamilyTreeNode => {
    if (processedMembers.has(m.id)) {
      return {
        id: m.id,
        name: m.name || "Unknown",
        gender: m.gender,
        generation: generations.get(m.id) || 0,
        children: [],
        spouses: [],
        parents: [],
      };
    }

    processedMembers.add(m.id);

    const node: FamilyTreeNode = {
      id: m.id,
      name: m.name || "Unknown",
      gender: m.gender,
      generation: generations.get(m.id) || 0,
      children: [],
      spouses: [],
      parents: [],
    };

    // Use the complete relationship data instead of just the member's direct relationships
    const completeMemberData = relationshipMap.get(m.id);

    if (completeMemberData) {
      // Add spouses (at same level)
      completeMemberData.spouses?.forEach((spouse: any) => {
        if (!processedMembers.has(spouse.id)) {
          node.spouses.push(buildNode(spouse));
        }
      });

      // Add children (descendants - hierarchical)
      completeMemberData.children?.forEach((child: any) => {
        if (!processedMembers.has(child.id)) {
          node.children.push(buildNode(child));
        }
      });
    }

    return node;
  };

  return buildNode(rootMember);
};

// New function to build tree structure from tree API response
export const buildFamilyTreeFromApiData = (treeData: {
  nodes: TreeNode[];
  connections?: any[];
  metadata?: any;
}): FamilyTreeNode | null => {
  if (!treeData.nodes || treeData.nodes.length === 0) {
    return null;
  }

  console.log("🌳 Building tree from API data:");
  console.log("📊 Nodes:", treeData.nodes?.length);
  console.log("🔗 Connections:", treeData.connections?.length);

  // Ensure we have the required data
  if (!treeData.nodes || !Array.isArray(treeData.nodes)) {
    console.error("❌ No nodes data available");
    return null;
  }

  if (!treeData.connections || !Array.isArray(treeData.connections)) {
    console.warn(
      "⚠️ No connections data available, building tree without relationships"
    );
  }

  // Create a map of nodes for quick lookup
  const nodeMap = new Map<string, TreeNode>();
  treeData.nodes.forEach((node) => nodeMap.set(node.id, node));

  // Create relationship maps
  const parentMap = new Map<string, TreeNode[]>();
  const spouseMap = new Map<string, TreeNode[]>();
  const childMap = new Map<string, TreeNode[]>();

  // Process connections to build relationships
  treeData.connections?.forEach((connection: any) => {
    const sourceId =
      typeof connection.from === "string" ? connection.from : connection.from;
    const targetId =
      typeof connection.to === "string" ? connection.to : connection.to;
    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);

    if (!sourceNode || !targetNode) return;

    switch (connection.type) {
      case "parent":
        // source is parent of target
        if (!childMap.has(sourceNode.id)) childMap.set(sourceNode.id, []);
        if (!parentMap.has(targetNode.id)) parentMap.set(targetNode.id, []);
        childMap.get(sourceNode.id)!.push(targetNode);
        parentMap.get(targetNode.id)!.push(sourceNode);
        break;
      case "child":
        // source is parent of target (reverse of parent link)
        if (!childMap.has(sourceNode.id)) childMap.set(sourceNode.id, []);
        if (!parentMap.has(targetNode.id)) parentMap.set(targetNode.id, []);
        childMap.get(sourceNode.id)!.push(targetNode);
        parentMap.get(targetNode.id)!.push(sourceNode);
        break;
      case "spouse":
        // source and target are spouses
        if (!spouseMap.has(sourceNode.id)) spouseMap.set(sourceNode.id, []);
        if (!spouseMap.has(targetNode.id)) spouseMap.set(targetNode.id, []);
        spouseMap.get(sourceNode.id)!.push(targetNode);
        spouseMap.get(targetNode.id)!.push(sourceNode);
        break;
    }
  });

  // Find the root ancestor (oldest generation)
  const rootNode = treeData.nodes.reduce((oldest, current) =>
    (current.generation || 0) < (oldest.generation || 0) ? current : oldest
  );

  console.log("👴 Root ancestor:", rootNode.name, "(ID:", rootNode.id + ")");

  // Show root relationships
  const rootChildren = childMap.get(rootNode.id) || [];
  const rootSpouses = spouseMap.get(rootNode.id) || [];
  const rootParents = parentMap.get(rootNode.id) || [];

  console.log("👨‍👩‍👧‍👦 Root relationships:");
  console.log(
    "  - Children:",
    rootChildren.length,
    rootChildren.map((c) => c.name).join(", ") || "none"
  );
  console.log(
    "  - Spouses:",
    rootSpouses.length,
    rootSpouses.map((s) => s.name).join(", ") || "none"
  );
  console.log(
    "  - Parents:",
    rootParents.length,
    rootParents.map((p) => p.name).join(", ") || "none"
  );

  const processedMembers = new Set<string>();

  const buildNode = (node: TreeNode): FamilyTreeNode => {
    if (processedMembers.has(node.id)) {
      return {
        id: node.id,
        name: node.name,
        gender: node.gender,
        generation: node.generation || 0,
        children: [],
        spouses: [],
        parents: [],
      };
    }

    processedMembers.add(node.id);

    const familyNode: FamilyTreeNode = {
      id: node.id,
      name: node.name,
      gender: node.gender,
      generation: node.generation || 0,
      children: [],
      spouses: [],
      parents: [],
    };

    // Add spouses (at same level)
    const spouses = spouseMap.get(node.id) || [];
    spouses.forEach((spouse) => {
      if (!processedMembers.has(spouse.id)) {
        familyNode.spouses.push(buildNode(spouse));
      }
    });

    // Add children (descendants - hierarchical)
    const children = childMap.get(node.id) || [];
    children.forEach((child) => {
      if (!processedMembers.has(child.id)) {
        familyNode.children.push(buildNode(child));
      }
    });

    return familyNode;
  };

  return buildNode(rootNode);
};
