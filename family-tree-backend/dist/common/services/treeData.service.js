"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeDataService = void 0;
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
let TreeDataService = class TreeDataService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFamilyFolderTreeData(familyId) {
        const folderTreeData = await this.getFolderTreeData(familyId);
        const targetFamily = folderTreeData.families.find((f) => f.id === familyId);
        if (!targetFamily) {
            throw new common_1.BadRequestException("Family not found or access denied");
        }
        const allMembers = folderTreeData.families.flatMap((f) => f.members);
        const treeData = this.generateExcelTreeFormatWithIds(familyId, allMembers, {
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
        });
        return treeData;
    }
    generateExcelTreeFormatWithIds(familyId, members, exportRequest) {
        console.log("🔍 Starting generateExcelTreeFormatWithIds with members:", members.length);
        const treeData = [];
        const memberMap = new Map();
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
        console.log("🔗 Including spouses' family members for complete tree representation...");
        const additionalMembers = new Map();
        for (const [memberId, member] of memberMap.entries()) {
            if (member.spouses && member.spouses.length > 0) {
                member.spouses.forEach((spouse) => {
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
                            color: spouse.color || null,
                            parentColors: spouse.parentColors || [],
                        });
                    }
                });
            }
        }
        for (const [memberId, member] of additionalMembers.entries()) {
            memberMap.set(memberId, member);
        }
        console.log(`📊 Total members after including spouses' families: ${memberMap.size}`);
        this.normalizeRelationships(memberMap);
        const allMembersArray = Array.from(memberMap.values());
        this.assignColorsToMembers(allMembersArray);
        allMembersArray.forEach((member) => {
            memberMap.set(member.id, member);
        });
        console.log("📊 Total members indexed:", memberMap.size);
        const parentChildMap = new Map();
        const childParentMap = new Map();
        const familyMemberIds = new Set(members.map((m) => m.id));
        members.forEach((member) => {
            if (member.children && member.children.length > 0) {
                const familyChildren = member.children.filter((c) => familyMemberIds.has(c.id));
                if (familyChildren.length > 0) {
                    parentChildMap.set(member.id, familyChildren.map((c) => c.id));
                    familyChildren.forEach((child) => {
                        if (!childParentMap.has(child.id)) {
                            childParentMap.set(child.id, []);
                        }
                        childParentMap.get(child.id).push(member.id);
                    });
                }
            }
            if (member.parents && member.parents.length > 0) {
                const familyParents = member.parents.filter((p) => familyMemberIds.has(p.id));
                if (familyParents.length > 0) {
                    familyParents.forEach((parent) => {
                        if (!parentChildMap.has(parent.id)) {
                            parentChildMap.set(parent.id, []);
                        }
                        if (!parentChildMap.get(parent.id).includes(member.id)) {
                            parentChildMap.get(parent.id).push(member.id);
                        }
                    });
                    childParentMap.set(member.id, familyParents.map((p) => p.id));
                }
            }
        });
        const potentialRoots = Array.from(memberMap.values()).filter((member) => {
            const parentIds = childParentMap.get(member.id) || [];
            return parentIds.length === 0;
        });
        console.log("👴 Potential root ancestors found:", potentialRoots.map((r) => r.name));
        const trueRoots = potentialRoots.filter((member) => {
            if (!member.spouses || member.spouses.length === 0) {
                return true;
            }
            const hasAnySpouseWithParents = member.spouses.some((spouse) => {
                const spouseMember = memberMap.get(spouse.id);
                if (!spouseMember)
                    return false;
                const spouseParentIds = childParentMap.get(spouse.id) || [];
                return spouseParentIds.length > 0;
            });
            return !hasAnySpouseWithParents;
        });
        console.log("👴 True root ancestors found:", trueRoots.map((r) => r.name));
        const rootAncestors = [];
        const processedRootIds = new Set();
        trueRoots.forEach((member) => {
            if (processedRootIds.has(member.id))
                return;
            const spouseIds = member.spouses?.map((s) => s.id) || [];
            const rootSpouses = spouseIds
                .map((spouseId) => memberMap.get(spouseId))
                .filter((spouse) => spouse &&
                trueRoots.some((r) => r.id === spouse.id) &&
                !processedRootIds.has(spouse.id));
            if (rootSpouses.length > 0) {
                rootSpouses.forEach((spouse) => {
                    if (spouse && !processedRootIds.has(spouse.id)) {
                        const malePartner = member.gender === "MALE"
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
            }
            else {
                rootAncestors.push(member);
                processedRootIds.add(member.id);
            }
        });
        rootAncestors.sort((a, b) => a.name.localeCompare(b.name));
        const generations = new Map();
        const assignGenerations = (memberId, generation, visited = new Set()) => {
            if (visited.has(memberId))
                return;
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
        rootAncestors.forEach((root) => {
            assignGenerations(root.id, 0);
        });
        const processedMembers = new Set();
        const coupleChildrenMap = new Map();
        const allCouplesMap = new Map();
        const processedCouples = new Set();
        console.log("🔍 Identifying couples from members...");
        members.forEach((member) => {
            if (member.spouses && member.spouses.length > 0) {
                console.log(`👤 Member ${member.name} has ${member.spouses.length} spouses`);
                member.spouses.forEach((spouse) => {
                    const coupleKey1 = `${member.id}_${spouse.id}`;
                    const coupleKey2 = `${spouse.id}_${member.id}`;
                    if (!processedCouples.has(coupleKey1) &&
                        !processedCouples.has(coupleKey2)) {
                        processedCouples.add(coupleKey1);
                        allCouplesMap.set(coupleKey1, { spouseId: spouse.id, spouse });
                        console.log(`💑 Identified couple: ${member.name} + ${spouse.name}`);
                        const memberChildren = parentChildMap.get(member.id) || [];
                        const spouseChildren = parentChildMap.get(spouse.id) || [];
                        const sharedChildren = memberChildren.filter((childId) => spouseChildren.includes(childId));
                        if (sharedChildren.length > 0) {
                            coupleChildrenMap.set(coupleKey1, sharedChildren);
                            console.log(`👶 Couple has ${sharedChildren.length} shared children: ${sharedChildren
                                .map((id) => memberMap.get(id)?.name)
                                .join(", ")}`);
                        }
                        else {
                            console.log(`👶 Couple has no shared children`);
                        }
                    }
                });
            }
        });
        console.log(`📊 Total couples identified: ${allCouplesMap.size}`);
        console.log(`👶 Couples with shared children: ${coupleChildrenMap.size}`);
        const generateTree = (memberId, generation = 0, depth = 0) => {
            console.log(`🌲 Traversing member: ${memberMap.get(memberId)?.name} (Gen ${generation}, depth ${depth})`);
            if (processedMembers.has(memberId) ||
                depth > 8 ||
                !memberMap.has(memberId)) {
                console.log(`🚫 Skipping ${memberMap.get(memberId)?.name} - already processed or invalid`);
                return [];
            }
            const member = memberMap.get(memberId);
            const result = [];
            let handledAsCouple = false;
            for (const [coupleKey, sharedChildIds] of coupleChildrenMap.entries()) {
                const [member1Id, member2Id] = coupleKey.split("_");
                if (member1Id === memberId && !processedMembers.has(member2Id)) {
                    console.log(`💑 Found couple with children: ${member.name} + ${memberMap.get(member2Id)?.name}`);
                    console.log(`👶 Shared children: ${sharedChildIds
                        .map((id) => memberMap.get(id)?.name)
                        .join(", ")}`);
                    processedMembers.add(member1Id);
                    processedMembers.add(member2Id);
                    const spouse = memberMap.get(member2Id);
                    const relationshipLabel = this.getRelationshipLabel(generation);
                    const memberWithColor = {
                        ...member,
                        color: member.color,
                        parentColors: member.parentColors || [],
                    };
                    const spouseWithColor = spouse
                        ? {
                            ...spouse,
                            color: spouse.color || memberMap.get(spouse.id)?.color,
                            parentColors: spouse.parentColors ||
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
                    console.log(`👫 Member IDs:`, coupleMemberIds.map((m) => `${m.name} (${m.id})`));
                    console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);
                    result.push({
                        column: generation,
                        value,
                        memberIds: coupleMemberIds,
                    });
                    const unprocessedChildren = sharedChildIds
                        .filter((childId) => !processedMembers.has(childId) && memberMap.has(childId))
                        .map((childId) => memberMap.get(childId))
                        .sort((a, b) => {
                        const genA = generations.get(a.id) || 0;
                        const genB = generations.get(b.id) || 0;
                        if (genA !== genB)
                            return genA - genB;
                        return a.name.localeCompare(b.name);
                    });
                    console.log(`👶 Processing ${unprocessedChildren.length} shared children`);
                    unprocessedChildren.forEach((child) => {
                        result.push(...generateTree(child.id, generation + 1, depth + 1));
                    });
                    handledAsCouple = true;
                    break;
                }
            }
            if (!handledAsCouple) {
                for (const [coupleKey, coupleData] of allCouplesMap.entries()) {
                    const [member1Id, member2Id] = coupleKey.split("_");
                    if (member1Id === memberId && !processedMembers.has(member2Id)) {
                        console.log(`💑 Found couple without children: ${member.name} + ${memberMap.get(member2Id)?.name}`);
                        processedMembers.add(member1Id);
                        processedMembers.add(member2Id);
                        const spouse = memberMap.get(member2Id);
                        const relationshipLabel = this.getRelationshipLabel(generation);
                        const memberWithColor = {
                            ...member,
                            color: member.color,
                            parentColors: member.parentColors || [],
                        };
                        const spouseWithColor = spouse
                            ? {
                                ...spouse,
                                color: spouse.color || memberMap.get(spouse.id)?.color,
                                parentColors: spouse.parentColors ||
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
                        console.log(`👫 Member IDs:`, coupleMemberIds.map((m) => `${m.name} (${m.id})`));
                        console.log(`👫 Total memberIds count: ${coupleMemberIds.length}`);
                        result.push({
                            column: generation,
                            value,
                            memberIds: coupleMemberIds,
                        });
                        const allChildren = new Set([
                            ...(parentChildMap.get(member1Id) || []),
                            ...(parentChildMap.get(member2Id) || []),
                        ]);
                        console.log(`👶 All children from both partners: ${Array.from(allChildren)
                            .map((id) => memberMap.get(id)?.name)
                            .join(", ")}`);
                        const unprocessedChildren = Array.from(allChildren)
                            .filter((childId) => !processedMembers.has(childId) && memberMap.has(childId))
                            .map((childId) => memberMap.get(childId))
                            .sort((a, b) => {
                            const genA = generations.get(a.id) || 0;
                            const genB = generations.get(b.id) || 0;
                            if (genA !== genB)
                                return genA - genB;
                            return a.name.localeCompare(b.name);
                        });
                        console.log(`👶 Processing ${unprocessedChildren.length} children from both partners`);
                        unprocessedChildren.forEach((child) => {
                            result.push(...generateTree(child.id, generation + 1, depth + 1));
                        });
                        handledAsCouple = true;
                        break;
                    }
                }
            }
            if (!handledAsCouple) {
                let spouseHandled = false;
                if (member.spouses && member.spouses.length > 0) {
                    const unprocessedSpouses = member.spouses.filter((spouse) => !processedMembers.has(spouse.id) && memberMap.has(spouse.id));
                    if (unprocessedSpouses.length > 0) {
                        console.log(`👨‍👩‍👧‍👦 Creating unified family entry for: ${member.name} with ${unprocessedSpouses.length} spouses`);
                        processedMembers.add(memberId);
                        unprocessedSpouses.forEach((spouse) => {
                            processedMembers.add(spouse.id);
                        });
                        const genderSymbol1 = this.getGenderSymbol(member.gender);
                        const spouseNames = unprocessedSpouses
                            .map((spouse) => {
                            const spouseMember = memberMap.get(spouse.id);
                            const genderSymbol = this.getGenderSymbol(spouseMember?.gender || "UNKNOWN");
                            return `${spouseMember?.name} ${genderSymbol}`;
                        })
                            .join(" & ");
                        const relationshipLabel = this.getRelationshipLabel(generation);
                        const mainMemberWithColor = {
                            ...member,
                            color: member.color,
                            parentColors: member.parentColors || [],
                        };
                        const mainMemberDisplay = this.getColorDisplayString(mainMemberWithColor);
                        const spouseDisplays = unprocessedSpouses.map((spouse) => {
                            const fullSpouseMember = memberMap.get(spouse.id) || spouse;
                            const spouseWithColor = {
                                ...fullSpouseMember,
                                color: fullSpouseMember.color || spouse.color,
                                parentColors: fullSpouseMember.parentColors || spouse.parentColors || [],
                            };
                            return this.getColorDisplayString(spouseWithColor);
                        });
                        let value = `${mainMemberDisplay} ⚭ ${spouseDisplays.join(" & ")}`;
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
                            ...unprocessedSpouses.map((spouse) => {
                                const fullSpouseMember = memberMap.get(spouse.id) || spouse;
                                return {
                                    id: spouse.id,
                                    name: spouse.name,
                                    gender: spouse.gender,
                                    color: fullSpouseMember.color || spouse.color,
                                    parentColors: fullSpouseMember.parentColors || spouse.parentColors || [],
                                };
                            }),
                        ];
                        console.log(`👨‍👩‍👧‍👦 UNIFIED FAMILY ENTRY: ${value}`);
                        console.log(`👨‍👩‍👧‍👦 Member IDs:`, coupleMemberIds.map((m) => `${m.name} (${m.id})`));
                        console.log(`👨‍👩‍👧‍👦 Total memberIds count: ${coupleMemberIds.length}`);
                        result.push({
                            column: generation,
                            value,
                            memberIds: coupleMemberIds,
                        });
                        const allChildren = new Set();
                        (parentChildMap.get(memberId) || []).forEach((childId) => allChildren.add(childId));
                        unprocessedSpouses.forEach((spouse) => {
                            (parentChildMap.get(spouse.id) || []).forEach((childId) => allChildren.add(childId));
                        });
                        console.log(`👶 Combined children from all spouses: ${Array.from(allChildren)
                            .map((id) => memberMap.get(id)?.name)
                            .join(", ")}`);
                        const unprocessedChildren = Array.from(allChildren)
                            .filter((childId) => !processedMembers.has(childId) && memberMap.has(childId))
                            .map((childId) => memberMap.get(childId))
                            .sort((a, b) => {
                            const genA = generations.get(a.id) || 0;
                            const genB = generations.get(b.id) || 0;
                            if (genA !== genB)
                                return genA - genB;
                            return a.name.localeCompare(b.name);
                        });
                        console.log(`👶 Processing ${unprocessedChildren.length} combined children from all spouses`);
                        unprocessedChildren.forEach((child) => {
                            result.push(...generateTree(child.id, generation + 1, depth + 1));
                        });
                        spouseHandled = true;
                    }
                }
                if (!spouseHandled) {
                    console.log(`👤 Processing individual member: ${member.name}`);
                    processedMembers.add(memberId);
                    const genderSymbol = this.getGenderSymbol(member.gender);
                    const relationshipLabel = this.getRelationshipLabel(generation);
                    const memberWithColor = {
                        ...member,
                        color: member.color,
                        parentColors: member.parentColors || [],
                    };
                    const memberDisplay = this.getColorDisplayString(memberWithColor);
                    let value = `${memberDisplay} ${genderSymbol}`;
                    if (member.spouses && member.spouses.length > 0) {
                        const spouseNames = member.spouses
                            .filter((spouse) => processedMembers.has(spouse.id))
                            .map((spouse) => {
                            const spouseGender = this.getGenderSymbol(spouse.gender || "UNKNOWN");
                            return `${spouse.name} ${spouseGender}`;
                        });
                        if (spouseNames.length > 0) {
                            value += ` ⚭ ${spouseNames.join(" & ")}`;
                        }
                    }
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
                    const childIds = parentChildMap.get(memberId) || [];
                    console.log(`👶 Individual member ${member.name} has ${childIds.length} children: ${childIds
                        .map((id) => memberMap.get(id)?.name)
                        .join(", ")}`);
                    const unprocessedChildren = childIds
                        .filter((childId) => !processedMembers.has(childId) && memberMap.has(childId))
                        .map((childId) => memberMap.get(childId))
                        .sort((a, b) => {
                        const genA = generations.get(a.id) || 0;
                        const genB = generations.get(b.id) || 0;
                        if (genA !== genB)
                            return genA - genB;
                        return a.name.localeCompare(b.name);
                    });
                    console.log(`👶 Processing ${unprocessedChildren.length} unprocessed children for ${member.name}`);
                    unprocessedChildren.forEach((child) => {
                        result.push(...generateTree(child.id, generation + 1, depth + 1));
                    });
                }
            }
            return result;
        };
        console.log("🌳 Starting tree generation for root ancestors...");
        console.log("👴 Root ancestors:", rootAncestors.map((r) => `${r.name} (Gen ${generations.get(r.id) || 0})`));
        if (rootAncestors.length > 0) {
            rootAncestors.forEach((rootAncestor, index) => {
                console.log(`🌲 Processing root ancestor ${index + 1}: ${rootAncestor.name}`);
                if (index > 0) {
                    treeData.push({ column: 0, value: "", memberIds: [] });
                }
                const treeEntries = generateTree(rootAncestor.id);
                console.log(`📄 Generated ${treeEntries.length} tree entries for ${rootAncestor.name}`);
                treeData.push(...treeEntries);
            });
        }
        else {
            treeData.push({
                column: 0,
                value: "=== All Family Members (No Clear Hierarchy) ===",
                memberIds: [],
            });
            Array.from(memberMap.values()).forEach((member) => {
                const genderSymbol = this.getGenderSymbol(member.gender);
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
        const unprocessedMembers = Array.from(memberMap.values()).filter((m) => !processedMembers.has(m.id));
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
                if (genA !== genB)
                    return genA - genB;
                return a.name.localeCompare(b.name);
            })
                .forEach((member) => {
                const genderSymbol = this.getGenderSymbol(member.gender);
                const generation = generations.get(member.id) || 0;
                const relationshipLabel = this.getRelationshipLabel(generation);
                const memberWithColor = {
                    ...member,
                    color: member.color,
                    parentColors: member.parentColors || [],
                };
                const memberDisplay = this.getColorDisplayString(memberWithColor);
                let value = `${memberDisplay} ${genderSymbol}`;
                if (relationshipLabel)
                    value += ` [${relationshipLabel}]`;
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
        console.log("✅ Excel tree generation with IDs completed, entries:", treeData.length);
        return treeData;
    }
    async getFolderTreeData(familyId) {
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
        const calculateGeneration = (memberId, familyMembers, visited = new Set()) => {
            if (visited.has(memberId))
                return 0;
            visited.add(memberId);
            const member = familyMembers.find((m) => m.member.id === memberId);
            if (!member)
                return 0;
            const parents = member.member.parents;
            if (parents.length === 0)
                return 0;
            const parentGenerations = parents.map((parent) => calculateGeneration(parent.id, familyMembers, new Set(visited)));
            return Math.max(...parentGenerations, 0) + 1;
        };
        const transformedFamilies = families.map((family) => {
            const familyMembers = new Map();
            family.memberships.forEach((membership) => {
                const generation = calculateGeneration(membership.member.id, family.memberships);
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
            for (const fam of families) {
                if (fam.id === family.id)
                    continue;
                fam.memberships.forEach((membership) => {
                    const member = membership.member;
                    if (member.spouses && member.spouses.length > 0) {
                        member.spouses.forEach((spouse) => {
                            if (familyMembers.has(spouse.id)) {
                                if (!familyMembers.has(member.id)) {
                                    const generation = calculateGeneration(member.id, family.memberships);
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
                                    if (member.children && member.children.length > 0) {
                                        member.children.forEach((child) => {
                                            if (!familyMembers.has(child.id)) {
                                                let childData = null;
                                                for (const f of families) {
                                                    const childMembership = f.memberships.find((m) => m.member.id === child.id);
                                                    if (childMembership) {
                                                        childData = childMembership;
                                                        break;
                                                    }
                                                }
                                                if (childData) {
                                                    const childGeneration = calculateGeneration(child.id, family.memberships);
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
                members: Array.from(familyMembers.values()).sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name)),
            };
        });
        let filteredFamilies = transformedFamilies;
        const targetFamily = transformedFamilies.find((family) => family.id === familyId);
        const enhancedTargetFamily = {
            id: targetFamily.id,
            name: targetFamily.name,
            members: [...targetFamily.members],
        };
        const allMembers = filteredFamilies.flatMap((family) => family.members);
        const uniqueMembers = allMembers.filter((member, index, array) => array.findIndex((m) => m.id === member.id) === index);
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
    normalizeRelationships(memberMap) {
        console.log("🔄 Normalizing spouse relationships for bidirectionality...");
        for (const [memberId, member] of memberMap.entries()) {
            if (!member.spouses || member.spouses.length === 0)
                continue;
            for (const spouse of member.spouses) {
                const spouseMember = memberMap.get(spouse.id);
                if (!spouseMember)
                    continue;
                const hasReciprocalRelationship = spouseMember.spouses?.some((s) => s.id === memberId);
                if (!hasReciprocalRelationship) {
                    console.log(`🔗 Adding missing spouse relationship: ${member.name} ↔ ${spouseMember.name}`);
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
    getRelationshipLabel(generation) {
        return `Generation ${generation}`;
    }
    getGenderSymbol(gender) {
        switch (gender?.toUpperCase()) {
            case "MALE":
                return "♂";
            case "FEMALE":
                return "♀";
            default:
                return "⚲";
        }
    }
    generateRandomColor() {
        return ("#" +
            Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0"));
    }
    assignColorsToMembers(members) {
        console.log("🎨 Assigning colors to members...");
        members.forEach((member) => {
            if (!member.color) {
                member.color = this.generateRandomColor();
            }
            if (!member.parentColors) {
                member.parentColors = [];
            }
        });
        members.forEach((member) => {
            if (member.parents && member.parents.length > 0) {
                const parentColors = [];
                member.parents.forEach((parent) => {
                    const parentMember = members.find((m) => m.id === parent.id);
                    if (parentMember && parentMember.color) {
                        parentColors.push(parentMember.color);
                    }
                });
                member.parentColors = parentColors;
            }
        });
        console.log(`🎨 Assigned colors to ${members.length} members`);
    }
    getColorDisplayString(member) {
        if (!member.color)
            return member.name;
        const circles = [];
        circles.push(`●${member.color}`);
        if (member.parentColors && member.parentColors.length > 0) {
            const maxParents = Math.min(member.parentColors.length, 2);
            for (let i = 0; i < maxParents; i++) {
                circles.push(`○${member.parentColors[i]}`);
            }
        }
        return `${circles.join(" ")} ${member.name}`;
    }
};
exports.TreeDataService = TreeDataService;
exports.TreeDataService = TreeDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TreeDataService);
//# sourceMappingURL=treeData.service.js.map