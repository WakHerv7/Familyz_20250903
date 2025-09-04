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
exports.TreeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tree_dto_1 = require("./dto/tree.dto");
let TreeService = class TreeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFamilyTree(user, familyId, centerMemberId) {
        await this.verifyFamilyAccess(user, familyId);
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
            select: { name: true },
        });
        if (!family) {
            throw new common_1.NotFoundException('Family not found');
        }
        const members = await this.getVisibleMembers(user, familyId);
        const centerNodeId = centerMemberId || user.memberId || members[0]?.id;
        const { nodes, connections } = await this.buildTreeStructure(members, centerNodeId);
        const totalMembers = members.length;
        const generations = this.calculateGenerations(nodes, centerNodeId);
        return {
            nodes,
            connections,
            centerNodeId,
            familyId,
            familyName: family.name,
            totalMembers,
            generations,
        };
    }
    async getTreeStatistics(user, familyId) {
        await this.verifyFamilyAccess(user, familyId);
        const members = await this.getVisibleMembers(user, familyId);
        const families = await this.prisma.family.findMany({
            where: {
                OR: [
                    { id: familyId },
                    { parentFamilyId: familyId },
                ],
            },
        });
        const totalMembers = members.length;
        const totalFamilies = families.length;
        const genderDistribution = {
            male: members.filter(m => m.gender === 'MALE').length,
            female: members.filter(m => m.gender === 'FEMALE').length,
            other: members.filter(m => m.gender === 'OTHER').length,
            unspecified: members.filter(m => !m.gender || m.gender === 'PREFER_NOT_TO_SAY').length,
        };
        const statusDistribution = {
            active: members.filter(m => m.status === 'ACTIVE').length,
            inactive: members.filter(m => m.status === 'INACTIVE').length,
            deceased: members.filter(m => m.status === 'DECEASED').length,
            archived: members.filter(m => m.status === 'ARCHIVED').length,
        };
        const totalChildren = members.reduce((sum, member) => sum + (member.children?.length || 0), 0);
        const averageChildrenPerMember = totalMembers > 0 ? totalChildren / totalMembers : 0;
        let oldestMember, youngestMember;
        for (const member of members) {
            if (member.personalInfo && typeof member.personalInfo === 'object') {
                const birthYear = member.personalInfo.birthYear;
                if (typeof birthYear === 'number') {
                    if (!oldestMember || birthYear < oldestMember.birthYear) {
                        oldestMember = { id: member.id, name: member.name, birthYear };
                    }
                    if (!youngestMember || birthYear > youngestMember.birthYear) {
                        youngestMember = { id: member.id, name: member.name, birthYear };
                    }
                }
            }
        }
        const centerMemberId = user.memberId || members[0]?.id;
        const { nodes } = await this.buildTreeStructure(members, centerMemberId);
        const totalGenerations = this.calculateGenerations(nodes, centerMemberId);
        return {
            totalMembers,
            totalFamilies,
            totalGenerations,
            averageChildrenPerMember,
            oldestMember,
            youngestMember,
            genderDistribution,
            statusDistribution,
        };
    }
    async exportFamilyTree(user, exportDto) {
        await this.verifyFamilyAccess(user, exportDto.familyId);
        const treeData = await this.getFamilyTree(user, exportDto.familyId);
        switch (exportDto.format) {
            case tree_dto_1.TreeFormat.JSON:
                return this.exportAsJson(treeData, exportDto);
            case tree_dto_1.TreeFormat.CSV:
                return this.exportAsCsv(treeData, exportDto);
            case tree_dto_1.TreeFormat.PDF:
                return this.exportAsPdf(treeData, exportDto);
            default:
                throw new Error('Unsupported export format');
        }
    }
    async verifyFamilyAccess(user, familyId) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: user.memberId,
                familyId,
                isActive: true,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Access denied to this family');
        }
    }
    async getVisibleMembers(user, familyId) {
        const memberships = await this.prisma.familyMembership.findMany({
            where: {
                familyId,
                isActive: true,
            },
            include: {
                member: {
                    include: {
                        parents: { select: { id: true, name: true, gender: true } },
                        children: { select: { id: true, name: true, gender: true } },
                        spouses: { select: { id: true, name: true, gender: true } },
                        spousesReverse: { select: { id: true, name: true, gender: true } },
                    },
                },
            },
        });
        const userFamilyIds = await this.getUserFamilyIds(user.memberId);
        return memberships
            .filter(membership => {
            if (membership.familyId === familyId)
                return true;
            return userFamilyIds.includes(membership.familyId);
        })
            .map(membership => ({
            ...membership.member,
            spouses: [
                ...membership.member.spouses,
                ...membership.member.spousesReverse,
            ].filter((spouse, index, arr) => arr.findIndex(s => s.id === spouse.id) === index),
        }));
    }
    async getUserFamilyIds(memberId) {
        const memberships = await this.prisma.familyMembership.findMany({
            where: {
                memberId,
                isActive: true,
            },
            select: { familyId: true },
        });
        return memberships.map(m => m.familyId);
    }
    async buildTreeStructure(members, centerNodeId) {
        const nodes = [];
        const connections = [];
        const processedMembers = new Set();
        const positions = this.calculateNodePositions(members, centerNodeId);
        for (const member of members) {
            const position = positions.get(member.id) || { x: 0, y: 0, level: 0 };
            nodes.push({
                id: member.id,
                name: member.name,
                gender: member.gender,
                status: member.status,
                personalInfo: member.personalInfo,
                level: position.level,
                x: position.x,
                y: position.y,
                parentIds: member.parents?.map((p) => p.id) || [],
                childrenIds: member.children?.map((c) => c.id) || [],
                spouseIds: member.spouses?.map((s) => s.id) || [],
                createdAt: member.createdAt,
                updatedAt: member.updatedAt,
            });
            member.parents?.forEach((parent) => {
                connections.push({
                    from: parent.id,
                    to: member.id,
                    type: 'parent',
                    strength: 1.0,
                });
            });
            member.spouses?.forEach((spouse) => {
                if (!processedMembers.has(`${member.id}-${spouse.id}`) &&
                    !processedMembers.has(`${spouse.id}-${member.id}`)) {
                    connections.push({
                        from: member.id,
                        to: spouse.id,
                        type: 'spouse',
                        strength: 0.8,
                    });
                    processedMembers.add(`${member.id}-${spouse.id}`);
                }
            });
            member.children?.forEach((child) => {
                connections.push({
                    from: member.id,
                    to: child.id,
                    type: 'child',
                    strength: 1.0,
                });
            });
        }
        return { nodes, connections };
    }
    calculateNodePositions(members, centerNodeId) {
        const positions = new Map();
        const memberMap = new Map(members.map(m => [m.id, m]));
        const visited = new Set();
        const levelWidth = 300;
        const levelHeight = 150;
        const queue = [{ id: centerNodeId, level: 0 }];
        const levelCounts = new Map();
        while (queue.length > 0) {
            const { id, level, parentX } = queue.shift();
            if (visited.has(id))
                continue;
            visited.add(id);
            const member = memberMap.get(id);
            if (!member)
                continue;
            const currentLevelCount = levelCounts.get(level) || 0;
            levelCounts.set(level, currentLevelCount + 1);
            const x = parentX !== undefined ? parentX : currentLevelCount * levelWidth;
            const y = level * levelHeight;
            positions.set(id, { x, y, level });
            member.children?.forEach((child) => {
                if (!visited.has(child.id)) {
                    queue.push({ id: child.id, level: level + 1, parentX: x });
                }
            });
            member.parents?.forEach((parent) => {
                if (!visited.has(parent.id)) {
                    queue.push({ id: parent.id, level: level - 1, parentX: x });
                }
            });
            member.spouses?.forEach((spouse) => {
                if (!visited.has(spouse.id)) {
                    queue.push({ id: spouse.id, level, parentX: x + 100 });
                }
            });
        }
        return positions;
    }
    calculateGenerations(nodes, centerNodeId) {
        const levels = nodes.map(node => node.level);
        const minLevel = Math.min(...levels);
        const maxLevel = Math.max(...levels);
        return maxLevel - minLevel + 1;
    }
    exportAsJson(treeData, exportDto) {
        const filteredData = {
            ...treeData,
            nodes: treeData.nodes.map(node => ({
                ...node,
                ...(exportDto.includePersonalInfo ? {} : { personalInfo: undefined }),
            })),
        };
        return JSON.stringify(filteredData, null, 2);
    }
    exportAsCsv(treeData, exportDto) {
        const headers = [
            'ID', 'Name', 'Gender', 'Status', 'Level',
            'Parents', 'Children', 'Spouses', 'Created', 'Updated'
        ];
        if (exportDto.includePersonalInfo) {
            headers.push('Personal Info');
        }
        const rows = treeData.nodes.map(node => [
            node.id,
            node.name,
            node.gender || '',
            node.status,
            node.level.toString(),
            node.parentIds.join(';'),
            node.childrenIds.join(';'),
            node.spouseIds.join(';'),
            node.createdAt.toISOString(),
            node.updatedAt.toISOString(),
            ...(exportDto.includePersonalInfo ? [JSON.stringify(node.personalInfo || {})] : []),
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    exportAsPdf(treeData, exportDto) {
        const content = `Family Tree: ${treeData.familyName}\n\n` +
            `Total Members: ${treeData.totalMembers}\n` +
            `Generations: ${treeData.generations}\n\n` +
            treeData.nodes.map(node => `${node.name} (${node.gender || 'Unknown'}, ${node.status})`).join('\n');
        return Buffer.from(content, 'utf-8');
    }
};
exports.TreeService = TreeService;
exports.TreeService = TreeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TreeService);
//# sourceMappingURL=tree.service.js.map