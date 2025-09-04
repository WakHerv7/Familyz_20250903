import { Gender, RelationshipType } from "@/types";

export interface TreeNode {
  id: string;
  name: string;
  gender?: Gender;
  generation?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface TreeLink {
  source: string | TreeNode;
  target: string | TreeNode;
  type: "parent" | "spouse" | "child";
}

export interface FamilyTreeNode {
  id: string;
  name: string;
  gender?: Gender;
  generation?: number;
  children: FamilyTreeNode[];
  spouses: FamilyTreeNode[];
  parents: FamilyTreeNode[];
}

export interface InteractiveFamilyTreeProps {
  currentMember: any; // Using any to avoid import issues
  onMemberClick?: (memberId: string) => void;
}

export type ViewMode = "explorer" | "hierarchical" | "force";
