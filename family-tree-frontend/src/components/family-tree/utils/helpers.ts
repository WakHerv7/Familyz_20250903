import { Gender } from "@/types";

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getGenderColor = (gender?: Gender): string => {
  switch (gender) {
    case Gender.MALE:
      return "#3B82F6"; // blue
    case Gender.FEMALE:
      return "#EC4899"; // pink
    default:
      return "#6B7280"; // gray
  }
};

export const calculateGenerations = (member: any): Map<string, number> => {
  const generations = new Map<string, number>();
  const visited = new Set<string>();

  const assignGeneration = (m: Partial<any>, gen: number): void => {
    if (!m.id || visited.has(m.id)) return;

    visited.add(m.id);
    const existingGen = generations.get(m.id);

    if (existingGen === undefined || Math.abs(gen) < Math.abs(existingGen)) {
      generations.set(m.id, gen);
    }
  };

  // Start with current member at generation 0
  assignGeneration(member, 0);

  // Assign parents to generation -1
  member.parents?.forEach((parent: any) => {
    assignGeneration(parent, -1);
  });

  // Assign children to generation 1
  member.children?.forEach((child: any) => {
    assignGeneration(child, 1);
  });

  // Assign spouses to generation 0
  member.spouses?.forEach((spouse: any) => {
    assignGeneration(spouse, 0);
  });

  return generations;
};
