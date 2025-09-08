import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, BadRequestException } from "@nestjs/common";
import { FamilyRole } from "@prisma/client";

interface ExportConfig {
  formats: ("pdf" | "excel")[];
  familyTree: {
    structure: "folderTree" | "traditional" | "interactive" | "textTree";
    includeMembersList: boolean;
    memberDetails: (
      | "parent"
      | "children"
      | "spouses"
      | "personalInfo"
      | "contact"
    )[];
  };
}

interface ExportRequest {
  format: "pdf" | "excel";
  scope: "current-family" | "all-families" | "selected-families";
  familyIds?: string[];
  config: ExportConfig;
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}

interface FolderTreeExportData {
  families: {
    id: string;
    name: string;
    members: {
      id: string;
      name: string;
      role: FamilyRole;
      generation: number;
      parents: any[];
      children: any[];
      spouses: any[];
      personalInfo?: any;
      color?: string;
      parentColors?: string[];
    }[];
  }[];
  membersList: any[];
  generatedAt: Date;
  exportConfig: ExportConfig;
}

@Injectable()
export class TreeDataService {
  constructor(private prisma: PrismaService) {}

  async getFamilyFolderTreeData(
    // memberId: string,
    familyId: string
  ): Promise<
    {
      column: number;
      value: string;
      memberIds: {
        id: string;
        name: string;
        gender: string;
        color: string;
        parentColors: string[];
      }[];
    }[]
  > {
    // Get folder tree data for all accessible families
    const folderTreeData = await this.getFolderTreeData(familyId);

    // Find the target family to ensure user has access
    const targetFamily = folderTreeData.families.find((f) => f.id === familyId);
    if (!targetFamily) {
      throw new BadRequestException("Family not found or access denied");
    }

    // Get all members from all families for relationship context
    const allMembers = folderTreeData.families.flatMap((f) => f.members);

    // console.log(
    //   "targetFamily.members :: ",
    //   targetFamily.members.length,
    //   targetFamily.members
    // );
    // console.log("allMembers :: ", allMembers.length, allMembers);

    // Use family-specific tree generation
    const treeData = this.generateExcelTreeFormatWithIds(
      familyId,
      allMembers,
      //   targetFamily.members,
      {
        format: "excel",
        scope: "current-family",
        config: {
          formats: ["excel"],
          familyTree: {
            structure: "folderTree",
            includeMembersList: false,
            memberDetails: ["parent", "children", "spouses", "personalInfo"],
          },
        },
        includeData: {
          personalInfo: false,
          relationships: true,
          contactInfo: false,
          profileImages: false,
        },
      }
    );

    return treeData;
  }

  private generateExcelTreeFormatWithIds(
    familyId: string,
    members: any[],
    exportRequest: ExportRequest
  ): {
    column: number;
    value: string;
    memberIds: {
      id: string;
      name: string;
      gender: string;
      color: string;
      parentColors: string[];
    }[];
  }[] {
    console.log(
      "🔍 Starting generateExcelTreeFormatWithIds with members:",
      members.length
    );

    const treeData: {
      column: number;
      value: string;
      memberIds: {
        id: string;
        name: string;
        gender: string;
        color: string;
        parentColors: string[];
      }[];
    }[] = [];

    // Build proper family tree using existing relationships from database
    const memberMap = new Map<string, any>();

    // First pass: Index all members by ID and normalize data
    members.forEach((member) => {
      const normalizedMember = {
        id: member.id,
        name: member.name,
        gender: member.gender || "UNKNOWN",
        parents: member.parents || [],
        children: member.children || [],
        spouses: member.spouses || [],
        generation: member.generation || 0,
        personalInfo: member.personalInfo,
      };
      memberMap.set(member.id, normalizedMember);
    });

    // Second pass: Include spouses' family members to ensure complete representation
    console.log(
      "🔗 Including spouses' family members for complete tree representation..."
    );
    const additionalMembers = new Map<string, any>();

    for (const [memberId, member] of memberMap.entries()) {
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouse: any) => {
          // Add spouse if not already in memberMap
          if (!memberMap.has(spouse.id) && !additionalMembers.has(spouse.id)) {
            console.log(`👫 Adding spouse's family member: ${spouse.name}`);
            additionalMembers.set(spouse.id, {
              id: spouse.id,
              name: spouse.name,
              gender: spouse.gender || "UNKNOWN",
              parents: spouse.parents || [],
              children: spouse.children || [],
              spouses: spouse.spouses || [],
              generation: spouse.generation || 0,
              personalInfo: spouse.personalInfo,
              color: spouse.color || null, // Initialize color field
              parentColors: spouse.parentColors || [], // Initialize parentColors field
            });
          }
        });
      }
    }

    // Add additional members to the main memberMap
    for (const [memberId, member] of additionalMembers.entries()) {
      memberMap.set(memberId, member);
    }

    console.log(
      `📊 Total members after including spouses' families: ${memberMap.size}`
    );

    // Normalize relationships to ensure bidirectionality
    this.normalizeRelationships(memberMap);

    // Assign colors to all members for visualization
    const allMembersArray = Array.from(memberMap.values());
    this.assignColorsToMembers(allMembersArray);

    // Update memberMap with color-assigned members
    allMembersArray.forEach((member) => {
      memberMap.set(member.id, member);
    });

    console.log("📊 Total members indexed:", memberMap.size);
    // console.log("📊 memberMap indexed:", memberMap);

    // Build parent-child relationships map for easier traversal
    // Only consider parents and children that belong to the current family
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string[]>();

    // Create a set of member IDs that belong to the current family for quick lookup
    const familyMemberIds = new Set(members.map((m) => m.id));

    members.forEach((member) => {
      // Map children to their parents - only if children belong to current family
      if (member.children && member.children.length > 0) {
        const familyChildren = member.children.filter((c: any) =>
          familyMemberIds.has(c.id)
        );
        if (familyChildren.length > 0) {
          parentChildMap.set(
            member.id,
            familyChildren.map((c: any) => c.id)
          );

          // Also map each child back to this parent
          familyChildren.forEach((child: any) => {
            if (!childParentMap.has(child.id)) {
              childParentMap.set(child.id, []);
            }
            childParentMap.get(child.id)!.push(member.id);
          });
        }
      }

      // Map parents to their children - only if parents belong to current family
      if (member.parents && member.parents.length > 0) {
        const familyParents = member.parents.filter((p: any) =>
          familyMemberIds.has(p.id)
        );
        if (familyParents.length > 0) {
          familyParents.forEach((parent: any) => {
            if (!parentChildMap.has(parent.id)) {
              parentChildMap.set(parent.id, []);
            }
            if (!parentChildMap.get(parent.id)!.includes(member.id)) {
              parentChildMap.get(parent.id)!.push(member.id);
            }
          });

          childParentMap.set(
            member.id,
            familyParents.map((p: any) => p.id)
          );
        }
      }
    });

    // Find true root ancestors with spouse consideration
    const potentialRoots = Array.from(memberMap.values()).filter((member) => {
      const parentIds = childParentMap.get(member.id) || [];
      return parentIds.length === 0;
    });

    console.log(
      "👴 Potential root ancestors found:",
      potentialRoots.map((r) => r.name)
    );

    // Filter out members who have no parents but their spouse(s) have parents
    const trueRoots = potentialRoots.filter((member) => {
      // If member has no spouses, they are a true root
      if (!member.spouses || member.spouses.length === 0) {
        return true;
      }

      // Check if any spouse has parents - handle multiple spouses
      const hasAnySpouseWithParents = member.spouses.some((spouse: any) => {
        const spouseMember = memberMap.get(spouse.id);
        if (!spouseMember) return false;

        const spouseParentIds = childParentMap.get(spouse.id) || [];
        return spouseParentIds.length > 0;
      });

      // If any spouse has parents, this member is not a true root
      return !hasAnySpouseWithParents;
    });

    console.log(
      "👴 True root ancestors found:",
      trueRoots.map((r) => r.name)
    );

    // Group married couples at the root level - handle multiple spouses
    const rootAncestors = [];
    const processedRootIds = new Set();

    trueRoots.forEach((member) => {
      if (processedRootIds.has(member.id)) return;

      // Check if this member has spouses who are also roots
      const spouseIds = member.spouses?.map((s: any) => s.id) || [];
      const rootSpouses = spouseIds
        .map((spouseId) => memberMap.get(spouseId))
        .filter(
          (spouse) =>
            spouse &&
            trueRoots.some((r) => r.id === spouse.id) &&
            !processedRootIds.has(spouse.id)
        );

      if (rootSpouses.length > 0) {
        // Handle multiple spouses - create entries for each spouse relationship
        rootSpouses.forEach((spouse) => {
          if (spouse && !processedRootIds.has(spouse.id)) {
            // Create a couple entry for this specific spouse relationship
            const malePartner =
              member.gender === "MALE"
                ? member
                : spouse.gender === "MALE"
                ? spouse
                : member;
            const primaryPartner = malePartner;

            rootAncestors.push(primaryPartner);
            processedRootIds.add(member.id);
            processedRootIds.add(spouse.id);
          }
        });
      } else {
        // Single root ancestor
        rootAncestors.push(member);
        processedRootIds.add(member.id);
      }
    });

    rootAncestors.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate generations from each root
    const generations = new Map<string, number>();

    const assignGenerations = (
      memberId: string,
      generation: number,
      visited = new Set<string>()
    ) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);

      const existingGen = generations.get(memberId);
      if (existingGen === undefined || generation < existingGen) {
        generations.set(memberId, generation);
      }

      const childIds = parentChildMap.get(memberId) || [];
      childIds.forEach((childId) => {
        if (memberMap.has(childId)) {
          assignGenerations(childId, generation + 1, new Set(visited));
        }
      });
    };

    // Assign generations starting from roots
    rootAncestors.forEach((root) => {
      assignGenerations(root.id, 0);
    });

    const processedMembers = new Set<string>();

    // Identify all couples (with or without shared children)
    const coupleChildrenMap = new Map<string, string[]>();
    const allCouplesMap = new Map<string, { spouseId: string; spouse: any }>();
    const processedCouples = new Set<string>();

    console.log("🔍 Identifying couples from members...");
    members.forEach((member) => {
      if (member.spouses && member.spouses.length > 0) {
        console.log(
          `👤 Member ${member.name} has ${member.spouses.length} spouses`
        );
        member.spouses.forEach((spouse: any) => {
          const coupleKey1 = `${member.id}_${spouse.id}`;
          const coupleKey2 = `${spouse.id}_${member.id}`;

          if (
            !processedCouples.has(coupleKey1) &&
            !processedCouples.has(coupleKey2)
          ) {
            processedCouples.add(coupleKey1);

            // Store all couples
            allCouplesMap.set(coupleKey1, { spouseId: spouse.id, spouse });
            console.log(
              `💑 Identified couple: ${member.name} + ${spouse.name}`
            );

            // Find shared children between this couple
            const memberChildren: string[] =
              parentChildMap.get(member.id) || [];
            const spouseChildren: string[] =
              parentChildMap.get(spouse.id) || [];
            const sharedChildren: string[] = memberChildren.filter(
              (childId: string) => spouseChildren.includes(childId)
            );

            if (sharedChildren.length > 0) {
              coupleChildrenMap.set(coupleKey1, sharedChildren);
              console.log(
                `👶 Couple has ${
                  sharedChildren.length
                } shared children: ${sharedChildren
                  .map((id: string) => memberMap.get(id)?.name)
                  .join(", ")}`
              );
            } else {
              console.log(`👶 Couple has no shared children`);
            }
          }
        });
      }
    });

    console.log(`📊 Total couples identified: ${allCouplesMap.size}`);
    console.log(`👶 Couples with shared children: ${coupleChildrenMap.size}`);

    const generateTree = (
      memberId: string,
      generation = 0,
      depth = 0
    ): {
      column: number;
      value: string;
      memberIds: {
        id: string;
        name: string;
        gender: string;
        color: string;
        parentColors: string[];
      }[];
    }[] => {
      console.log(
        `🌲 Traversing member: ${
          memberMap.get(memberId)?.name
        } (Gen ${generation}, depth ${depth})`
      );

      if (
        processedMembers.has(memberId) ||
        depth > 8 ||
        !memberMap.has(memberId)
      ) {
        console.log(
          `🚫 Skipping ${
            memberMap.get(memberId)?.name
          } - already processed or invalid`
        );
        return [];
      }

      const member = memberMap.get(memberId);
      const result: {
        column: number;
        value: string;
        memberIds: {
          id: string;
          name: string;
          gender: string;
          color: string;
          parentColors: string[];
        }[];
      }[] = [];

      // Check if this member is part of any couple (with or without shared children)
      let handledAsCouple = false;

      // First check couples with shared children
      for (const [coupleKey, sharedChildIds] of coupleChildrenMap.entries()) {
        const [member1Id, member2Id] = coupleKey.split("_");

        if (member1Id === memberId && !processedMembers.has(member2Id)) {
          console.log(
            `💑 Found couple with children: ${member.name} + ${
              memberMap.get(member2Id)?.name
            }`
          );
          console.log(
            `👶 Shared children: ${(sharedChildIds as string[])
              .map((id: string) => memberMap.get(id)?.name)
              .join(", ")}`
          );

          // This member is the primary in a couple - show both partners
          processedMembers.add(member1Id);
          processedMembers.add(member2Id);

          const spouse = memberMap.get(member2Id);
          const relationshipLabel = this.getRelationshipLabel(generation);

          // Create color display for both partners
          const memberWithColor = {
            ...member,
            color: member.color,
            parentColors: member.parentColors || [],
          };
          const spouseWithColor = spouse
            ? {
                ...spouse,
                color: spouse.color || memberMap.get(spouse.id)?.color,
                parentColors:
                  spouse.parentColors ||
                  memberMap.get(spouse.id)?.parentColors ||
                  [],
              }
            : null;

          const memberDisplay = this.getColorDisplayString(memberWithColor);
          const spouseDisplay = spouseWithColor
            ? this.getColorDisplayString(spouseWithColor)
            : "Unknown";

          let value = `${memberDisplay} ⚭ ${spouseDisplay}`;

          if (relationshipLabel) {
            value += ` [${relationshipLabel}]`;
          }
          const coupleMemberIds = [
            {
              id: member.id,
              name: member.name,
              gender: member.gender,
              color: member.color,
              parentColors: member.parentColors || [],
            },
            {
              id: spouse.id,
              name: spouse.name,
              gender: spouse.gender,
              color: spouse.color,
              parentColors: spouse.parentColors || [],
            },
          ];
          console.log(`👫 COUPLE WITH CHILDREN: ${value}`);
          console.log(
            `👫 Member IDs:`,
            coupleMemberIds.map((m) => `${m.name} (${m.id})`)
          );
          console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

          result.push({
            column: generation,
            value,
            memberIds: coupleMemberIds,
          });

          // Add shared children
          const unprocessedChildren = (sharedChildIds as string[])
            .filter(
              (childId: string) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId: string) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          console.log(
            `👶 Processing ${unprocessedChildren.length} shared children`
          );
          unprocessedChildren.forEach((child) => {
            result.push(...generateTree(child.id, generation + 1, depth + 1));
          });

          handledAsCouple = true;
          break;
        }
      }

      // If not handled as couple with children, check all couples
      if (!handledAsCouple) {
        for (const [coupleKey, coupleData] of allCouplesMap.entries()) {
          const [member1Id, member2Id] = coupleKey.split("_");

          if (member1Id === memberId && !processedMembers.has(member2Id)) {
            console.log(
              `💑 Found couple without children: ${member.name} + ${
                memberMap.get(member2Id)?.name
              }`
            );

            // This member is part of a couple - show both partners
            processedMembers.add(member1Id);
            processedMembers.add(member2Id);

            const spouse = memberMap.get(member2Id);
            const relationshipLabel = this.getRelationshipLabel(generation);

            // Create color display for both partners
            const memberWithColor = {
              ...member,
              color: member.color,
              parentColors: member.parentColors || [],
            };
            const spouseWithColor = spouse
              ? {
                  ...spouse,
                  color: spouse.color || memberMap.get(spouse.id)?.color,
                  parentColors:
                    spouse.parentColors ||
                    memberMap.get(spouse.id)?.parentColors ||
                    [],
                }
              : null;

            const memberDisplay = this.getColorDisplayString(memberWithColor);
            const spouseDisplay = spouseWithColor
              ? this.getColorDisplayString(spouseWithColor)
              : "Unknown";

            let value = `${memberDisplay} ⚭ ${spouseDisplay}`;

            if (relationshipLabel) {
              value += ` [${relationshipLabel}]`;
            }
            const coupleMemberIds = [
              {
                id: member.id,
                name: member.name,
                gender: member.gender,
                color: member.color,
                parentColors: member.parentColors || [],
              },
              {
                id: spouse.id,
                name: spouse.name,
                gender: spouse.gender,
                color: spouse.color,
                parentColors: spouse.parentColors || [],
              },
            ];
            console.log(`👫 COUPLE WITHOUT CHILDREN: ${value}`);
            console.log(
              `👫 Member IDs:`,
              coupleMemberIds.map((m) => `${m.name} (${m.id})`)
            );
            console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);

            result.push({
              column: generation,
              value,
              memberIds: coupleMemberIds,
            });

            // Add children from both partners
            const allChildren = new Set([
              ...(parentChildMap.get(member1Id) || []),
              ...(parentChildMap.get(member2Id) || []),
            ]);

            console.log(
              `👶 All children from both partners: ${Array.from(allChildren)
                .map((id) => memberMap.get(id)?.name)
                .join(", ")}`
            );

            const unprocessedChildren = Array.from(allChildren)
              .filter(
                (childId) =>
                  !processedMembers.has(childId) && memberMap.has(childId)
              )
              .map((childId) => memberMap.get(childId))
              .sort((a, b) => {
                const genA = generations.get(a.id) || 0;
                const genB = generations.get(b.id) || 0;
                if (genA !== genB) return genA - genB;
                return a.name.localeCompare(b.name);
              });

            console.log(
              `👶 Processing ${unprocessedChildren.length} children from both partners`
            );
            unprocessedChildren.forEach((child) => {
              result.push(...generateTree(child.id, generation + 1, depth + 1));
            });

            handledAsCouple = true;
            break;
          }
        }
      }

      if (!handledAsCouple) {
        // Check if this member has unprocessed spouses - GROUP ALL SPOUSES TOGETHER
        let spouseHandled = false;
        if (member.spouses && member.spouses.length > 0) {
          const unprocessedSpouses = member.spouses.filter(
            (spouse: any) =>
              !processedMembers.has(spouse.id) && memberMap.has(spouse.id)
          );

          if (unprocessedSpouses.length > 0) {
            // Group ALL spouses together in a single entry
            console.log(
              `👨‍👩‍👧‍👦 Creating unified family entry for: ${member.name} with ${unprocessedSpouses.length} spouses`
            );

            // Mark all spouses as processed
            processedMembers.add(memberId);
            unprocessedSpouses.forEach((spouse: any) => {
              processedMembers.add(spouse.id);
            });

            const genderSymbol1 = this.getGenderSymbol(member.gender);
            const spouseNames = unprocessedSpouses
              .map((spouse) => {
                const spouseMember = memberMap.get(spouse.id);
                const genderSymbol = this.getGenderSymbol(
                  spouseMember?.gender || "UNKNOWN"
                );
                return `${spouseMember?.name} ${genderSymbol}`;
              })
              .join(" & ");

            const relationshipLabel = this.getRelationshipLabel(generation);

            // Create color display for the main member
            const mainMemberWithColor = {
              ...member,
              color: member.color,
              parentColors: member.parentColors || [],
            };
            const mainMemberDisplay =
              this.getColorDisplayString(mainMemberWithColor);

            // Create color displays for spouses
            const spouseDisplays = unprocessedSpouses.map((spouse: any) => {
              // Get the full member data from memberMap instead of using basic spouse object
              const fullSpouseMember = memberMap.get(spouse.id) || spouse;
              const spouseWithColor = {
                ...fullSpouseMember,
                color: fullSpouseMember.color || spouse.color,
                parentColors:
                  fullSpouseMember.parentColors || spouse.parentColors || [],
              };
              return this.getColorDisplayString(spouseWithColor);
            });

            let value = `${mainMemberDisplay} ⚭ ${spouseDisplays.join(" & ")}`;

            if (relationshipLabel) {
              value += ` [${relationshipLabel}]`;
            }

            // Include all spouses in memberIds
            const coupleMemberIds = [
              {
                id: member.id,
                name: member.name,
                gender: member.gender,
                color: member.color,
                parentColors: member.parentColors || [],
              },
              ...unprocessedSpouses.map((spouse: any) => {
                // Get full member data from memberMap for accurate color information
                const fullSpouseMember = memberMap.get(spouse.id) || spouse;
                return {
                  id: spouse.id,
                  name: spouse.name,
                  gender: spouse.gender,
                  color: fullSpouseMember.color || spouse.color,
                  parentColors:
                    fullSpouseMember.parentColors || spouse.parentColors || [],
                };
              }),
            ];

            console.log(`👨‍👩‍👧‍👦 UNIFIED FAMILY ENTRY: ${value}`);
            console.log(
              `👨‍👩‍👧‍👦 Member IDs:`,
              coupleMemberIds.map((m) => `${m.name} (${m.id})`)
            );
            console.log(`👨‍👩‍👧‍👦 Total memberIds count: ${coupleMemberIds.length}`);

            result.push({
              column: generation,
              value,
              memberIds: coupleMemberIds,
            });

            // Combine ALL children from ALL spouses
            const allChildren = new Set();
            // Add children from the main member
            (parentChildMap.get(memberId) || []).forEach((childId) =>
              allChildren.add(childId)
            );
            // Add children from all spouses
            unprocessedSpouses.forEach((spouse) => {
              (parentChildMap.get(spouse.id) || []).forEach((childId) =>
                allChildren.add(childId)
              );
            });

            console.log(
              `👶 Combined children from all spouses: ${Array.from(allChildren)
                .map((id: string) => memberMap.get(id)?.name)
                .join(", ")}`
            );

            const unprocessedChildren = Array.from(allChildren)
              .filter(
                (childId: string) =>
                  !processedMembers.has(childId) && memberMap.has(childId)
              )
              .map((childId: string) => memberMap.get(childId))
              .sort((a, b) => {
                const genA = generations.get(a.id) || 0;
                const genB = generations.get(b.id) || 0;
                if (genA !== genB) return genA - genB;
                return a.name.localeCompare(b.name);
              });

            console.log(
              `👶 Processing ${unprocessedChildren.length} combined children from all spouses`
            );
            unprocessedChildren.forEach((child) => {
              result.push(...generateTree(child.id, generation + 1, depth + 1));
            });

            spouseHandled = true;
          }
        }

        if (!spouseHandled) {
          console.log(`👤 Processing individual member: ${member.name}`);
          // Handle as individual member
          processedMembers.add(memberId);

          const genderSymbol = this.getGenderSymbol(member.gender);
          const relationshipLabel = this.getRelationshipLabel(generation);

          // Create color display for individual member
          const memberWithColor = {
            ...member,
            color: member.color,
            parentColors: member.parentColors || [],
          };
          const memberDisplay = this.getColorDisplayString(memberWithColor);

          let value = `${memberDisplay} ${genderSymbol}`;

          // Add spouse information for display (but spouses already processed)
          if (member.spouses && member.spouses.length > 0) {
            const spouseNames = member.spouses
              .filter((spouse: any) => processedMembers.has(spouse.id)) // Only show already processed spouses
              .map((spouse: any) => {
                const spouseGender = this.getGenderSymbol(
                  spouse.gender || "UNKNOWN"
                );
                return `${spouse.name} ${spouseGender}`;
              });

            if (spouseNames.length > 0) {
              value += ` ⚭ ${spouseNames.join(" & ")}`;
            }
          }

          // Add relationship label
          if (relationshipLabel) {
            value += ` [${relationshipLabel}]`;
          }

          result.push({
            column: generation,
            value,
            memberIds: [
              {
                id: member.id,
                name: member.name,
                gender: member.gender,
                color: member.color,
                parentColors: member.parentColors || [],
              },
            ],
          });

          // Add children
          const childIds = parentChildMap.get(memberId) || [];
          console.log(
            `👶 Individual member ${member.name} has ${
              childIds.length
            } children: ${childIds
              .map((id) => memberMap.get(id)?.name)
              .join(", ")}`
          );

          const unprocessedChildren = childIds
            .filter(
              (childId) =>
                !processedMembers.has(childId) && memberMap.has(childId)
            )
            .map((childId) => memberMap.get(childId))
            .sort((a, b) => {
              const genA = generations.get(a.id) || 0;
              const genB = generations.get(b.id) || 0;
              if (genA !== genB) return genA - genB;
              return a.name.localeCompare(b.name);
            });

          console.log(
            `👶 Processing ${unprocessedChildren.length} unprocessed children for ${member.name}`
          );
          unprocessedChildren.forEach((child) => {
            result.push(...generateTree(child.id, generation + 1, depth + 1));
          });
        }
      }

      return result;
    };

    console.log("🌳 Starting tree generation for root ancestors...");
    console.log(
      "👴 Root ancestors:",
      rootAncestors.map((r) => `${r.name} (Gen ${generations.get(r.id) || 0})`)
    );

    // Generate trees for all root ancestors
    if (rootAncestors.length > 0) {
      rootAncestors.forEach((rootAncestor, index) => {
        console.log(
          `🌲 Processing root ancestor ${index + 1}: ${rootAncestor.name}`
        );
        if (index > 0) {
          treeData.push({ column: 0, value: "", memberIds: [] }); // Empty line between trees
        }
        const treeEntries = generateTree(rootAncestor.id);
        console.log(
          `📄 Generated ${treeEntries.length} tree entries for ${rootAncestor.name}`
        );
        treeData.push(...treeEntries);
      });
    } else {
      treeData.push({
        column: 0,
        value: "=== All Family Members (No Clear Hierarchy) ===",
        memberIds: [],
      });
      Array.from(memberMap.values()).forEach((member) => {
        const genderSymbol = this.getGenderSymbol(member.gender);

        // Create color display for fallback members
        const memberWithColor = {
          ...member,
          color: member.color,
          parentColors: member.parentColors || [],
        };
        const memberDisplay = this.getColorDisplayString(memberWithColor);

        treeData.push({
          column: 0,
          value: `${memberDisplay} ${genderSymbol}`,
          memberIds: [
            {
              id: member.id,
              name: member.name,
              gender: member.gender,
              color: member.color,
              parentColors: member.parentColors || [],
            },
          ],
        });
      });
    }

    // Add any remaining unprocessed members
    const unprocessedMembers = Array.from(memberMap.values()).filter(
      (m) => !processedMembers.has(m.id)
    );

    if (unprocessedMembers.length > 0) {
      treeData.push({ column: 0, value: "", memberIds: [] });
      treeData.push({
        column: 0,
        value: "=== Additional Family Members ===",
        memberIds: [],
      });
      unprocessedMembers
        .sort((a, b) => {
          const genA = generations.get(a.id) || 0;
          const genB = generations.get(b.id) || 0;
          if (genA !== genB) return genA - genB;
          return a.name.localeCompare(b.name);
        })
        .forEach((member) => {
          const genderSymbol = this.getGenderSymbol(member.gender);
          const generation = generations.get(member.id) || 0;
          const relationshipLabel = this.getRelationshipLabel(generation);

          // Create color display for additional members
          const memberWithColor = {
            ...member,
            color: member.color,
            parentColors: member.parentColors || [],
          };
          const memberDisplay = this.getColorDisplayString(memberWithColor);

          let value = `${memberDisplay} ${genderSymbol}`;
          if (relationshipLabel) value += ` [${relationshipLabel}]`;
          treeData.push({
            column: generation,
            value,
            memberIds: [
              {
                id: member.id,
                name: member.name,
                gender: member.gender,
                color: member.color,
                parentColors: member.parentColors || [],
              },
            ],
          });
        });
    }

    console.log(
      "✅ Excel tree generation with IDs completed, entries:",
      treeData.length
    );
    return treeData;
  }

  async getFolderTreeData(familyId?: string): Promise<FolderTreeExportData> {
    let families = await this.prisma.family.findMany({
      where: { id: familyId },
      include: {
        memberships: {
          include: {
            member: {
              include: {
                parents: {
                  select: {
                    id: true,
                    name: true,
                    gender: true,
                    status: true,
                    color: true,
                    parentColors: true,
                  },
                },
                children: {
                  select: {
                    id: true,
                    name: true,
                    gender: true,
                    status: true,
                    color: true,
                    parentColors: true,
                  },
                },
                spouses: {
                  select: {
                    id: true,
                    name: true,
                    gender: true,
                    status: true,
                    color: true,
                    parentColors: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    // console.log(
    //   "let families = await this.prisma.family.findMany :: ",
    //   families
    // );
    // if (families?.[0]?.memberships) {
    //   for (const membership of families?.[0]?.memberships) {
    //     console.log("member ::", membership.member);
    //   }
    // }

    // Calculate generations for each member
    const calculateGeneration = (
      memberId: string,
      familyMembers: any[],
      visited = new Set()
    ): number => {
      if (visited.has(memberId)) return 0;
      visited.add(memberId);

      const member = familyMembers.find((m) => m.member.id === memberId);
      if (!member) return 0;

      const parents = member.member.parents;
      if (parents.length === 0) return 0;

      const parentGenerations = parents.map((parent: any) =>
        calculateGeneration(parent.id, familyMembers, new Set(visited))
      );

      return Math.max(...parentGenerations, 0) + 1;
    };

    // Transform families data - each family gets its own complete member list
    const transformedFamilies = families.map((family) => {
      // Start with direct family members
      const familyMembers = new Map();

      // Add all direct family members
      family.memberships.forEach((membership) => {
        const generation = calculateGeneration(
          membership.member.id,
          family.memberships
        );

        console.log("generation ::", generation);
        console.log("member ::", membership.member);

        familyMembers.set(membership.member.id, {
          id: membership.member.id,
          name: membership.member.name,
          gender: membership.member.gender,
          role: membership.role,
          generation,
          parents: membership.member.parents,
          children: membership.member.children,
          spouses: membership.member.spouses,
          personalInfo: membership.member.personalInfo,
          color: membership.member.color,
          parentColors: membership.member.parentColors,
          isDirectMember: true,
        });
      });

      // For each family, we want to include ALL members who have relationships with this family
      // This means spouses of family members AND their children
      for (const fam of families) {
        if (fam.id === family.id) continue; // Skip current family

        fam.memberships.forEach((membership) => {
          const member = membership.member;

          // Check if this member has spouses in our current family
          if (member.spouses && member.spouses.length > 0) {
            member.spouses.forEach((spouse: any) => {
              if (familyMembers.has(spouse.id)) {
                // This member has a spouse in our family, so include them
                if (!familyMembers.has(member.id)) {
                  const generation = calculateGeneration(
                    member.id,
                    family.memberships
                  );

                  familyMembers.set(member.id, {
                    id: member.id,
                    name: member.name,
                    gender: member.gender,
                    role: membership.role,
                    generation,
                    parents: member.parents,
                    children: member.children,
                    spouses: member.spouses,
                    personalInfo: member.personalInfo,
                    color: member.color,
                    parentColors: member.parentColors,
                    isDirectMember: false,
                  });

                  // Also include their children
                  if (member.children && member.children.length > 0) {
                    member.children.forEach((child: any) => {
                      if (!familyMembers.has(child.id)) {
                        // Find child's data
                        let childData = null;
                        for (const f of families) {
                          const childMembership = f.memberships.find(
                            (m) => m.member.id === child.id
                          );
                          if (childMembership) {
                            childData = childMembership;
                            break;
                          }
                        }

                        if (childData) {
                          const childGeneration = calculateGeneration(
                            child.id,
                            family.memberships
                          );

                          familyMembers.set(child.id, {
                            id: child.id,
                            name: childData.member.name,
                            gender: childData.member.gender,
                            role: childData.role,
                            generation: childGeneration,
                            parents: childData.member.parents,
                            children: childData.member.children,
                            spouses: childData.member.spouses,
                            personalInfo: childData.member.personalInfo,
                            color: childData.member.color,
                            parentColors: childData.member.parentColors,
                            isDirectMember: false,
                          });
                        }
                      }
                    });
                  }
                }
              }
            });
          }
        });
      }

      return {
        id: family.id,
        name: family.name,
        members: Array.from(familyMembers.values()).sort(
          (a, b) => a.generation - b.generation || a.name.localeCompare(b.name)
        ),
      };
    });

    // console.log(
    //   "transformedFamilies.members ::",
    //   transformedFamilies?.[0].members?.length,
    //   transformedFamilies?.[0].members
    // );
    // Filter families if familyId is provided
    let filteredFamilies = transformedFamilies;

    const targetFamily = transformedFamilies.find(
      (family) => family.id === familyId
    );
    // Create a new family object that includes related members from other families
    const enhancedTargetFamily = {
      id: targetFamily.id,
      name: targetFamily.name,
      members: [...targetFamily.members], // Start with direct members
    };

    // Add related members from other families
    // for (const otherFamily of transformedFamilies) {
    //   if (otherFamily.id === familyId) continue; // Skip the target family itself

    //   for (const member of otherFamily.members) {
    //     // Check if this member has relationships with the target family
    //     const hasSpouseInTargetFamily = member.spouses?.some((spouse: any) =>
    //       targetFamily.members.some(
    //         (targetMember) => targetMember.id === spouse.id
    //       )
    //     );

    //     const hasChildInTargetFamily = member.children?.some((child: any) =>
    //       targetFamily.members.some(
    //         (targetMember) => targetMember.id === child.id
    //       )
    //     );

    //     const hasParentInTargetFamily = member.parents?.some((parent: any) =>
    //       targetFamily.members.some(
    //         (targetMember) => targetMember.id === parent.id
    //       )
    //     );

    //     // If this member has any relationship with the target family, include them
    //     if (
    //       hasSpouseInTargetFamily ||
    //       hasChildInTargetFamily ||
    //       hasParentInTargetFamily
    //     ) {
    //       // Check if this member is already in the target family
    //       const alreadyExists = enhancedTargetFamily.members.some(
    //         (m) => m.id === member.id
    //       );
    //       if (!alreadyExists) {
    //         enhancedTargetFamily.members.push({
    //           ...member,
    //           isDirectMember: false, // Mark as indirect member
    //         });
    //       }
    //     }
    //   }
    // }

    // filteredFamilies = [enhancedTargetFamily];
    // console.log(
    //   "filteredFamilies.members ::",
    //   filteredFamilies?.[0].members?.length,
    //   filteredFamilies?.[0].members
    // );

    // Get all unique members for members list
    const allMembers = filteredFamilies.flatMap((family) => family.members);
    const uniqueMembers = allMembers.filter(
      (member, index, array) =>
        array.findIndex((m) => m.id === member.id) === index
    );

    // console.log("allMembers ::", allMembers.length, allMembers);
    // console.log("uniqueMembers ::", uniqueMembers.length, uniqueMembers);

    return {
      families: filteredFamilies,
      membersList: uniqueMembers,
      generatedAt: new Date(),
      exportConfig: {
        formats: ["pdf", "excel"],
        familyTree: {
          structure: "folderTree",
          includeMembersList: true,
          memberDetails: ["parent", "children", "spouses", "personalInfo"],
        },
      },
    };
  }

  private normalizeRelationships(memberMap: Map<string, any>): void {
    console.log("🔄 Normalizing spouse relationships for bidirectionality...");

    // Simple approach: loop through each member's spouses and ensure bidirectionality
    for (const [memberId, member] of memberMap.entries()) {
      if (!member.spouses || member.spouses.length === 0) continue;

      // Loop through each spouse of this member
      for (const spouse of member.spouses) {
        const spouseMember = memberMap.get(spouse.id);
        if (!spouseMember) continue;

        // Check if this member is in the spouse's spouse list
        const hasReciprocalRelationship = spouseMember.spouses?.some(
          (s: any) => s.id === memberId
        );

        // If not, add this member to the spouse's spouse list
        if (!hasReciprocalRelationship) {
          console.log(
            `🔗 Adding missing spouse relationship: ${member.name} ↔ ${spouseMember.name}`
          );

          if (!spouseMember.spouses) {
            spouseMember.spouses = [];
          }

          spouseMember.spouses.push({
            id: member.id,
            name: member.name,
            gender: member.gender,
          });
        }
      }
    }

    console.log("✅ Spouse relationship normalization completed");
  }

  private getRelationshipLabel(generation: number): string {
    // Return simple generation numbers
    return `Generation ${generation}`;
  }

  private getGenderSymbol(gender: string): string {
    switch (gender?.toUpperCase()) {
      case "MALE":
        return "♂";
      case "FEMALE":
        return "♀";
      default:
        return "⚲"; // Gender-neutral symbol
    }
  }

  // Color System Methods
  private generateRandomColor(): string {
    // Generate a random hex color
    return (
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
    );
  }

  private assignColorsToMembers(members: any[]): void {
    console.log("🎨 Assigning colors to members...");

    // First pass: Assign random colors if not present
    members.forEach((member: any) => {
      if (!member.color) {
        member.color = this.generateRandomColor();
      }
      if (!member.parentColors) {
        member.parentColors = [];
      }
    });

    // Second pass: Calculate parent colors for inheritance
    members.forEach((member: any) => {
      if (member.parents && member.parents.length > 0) {
        const parentColors: string[] = [];

        member.parents.forEach((parent: any) => {
          // Find parent in members array
          const parentMember = members.find((m) => m.id === parent.id);
          if (parentMember && parentMember.color) {
            parentColors.push(parentMember.color);
          }
        });

        // Store parent colors for inheritance
        member.parentColors = parentColors;
      }
    });

    console.log(`🎨 Assigned colors to ${members.length} members`);
  }

  private getColorDisplayString(member: any): string {
    if (!member.color) return member.name;

    // Create 3-circle display: [own-color] [parent1-color] [parent2-color] Name
    const circles = [];

    // Bigger circle for member's own color
    circles.push(`●${member.color}`);

    // Smaller circles for parent colors (max 2)
    if (member.parentColors && member.parentColors.length > 0) {
      const maxParents = Math.min(member.parentColors.length, 2);
      for (let i = 0; i < maxParents; i++) {
        circles.push(`○${member.parentColors[i]}`);
      }
    }

    return `${circles.join(" ")} ${member.name}`;
  }
}
