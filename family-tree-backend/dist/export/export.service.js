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
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExportService = class ExportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFolderTreeData(memberId) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            include: {
                familyMemberships: {
                    include: {
                        family: true,
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.BadRequestException('Member not found');
        }
        const isAdmin = member.familyMemberships.some(membership => membership.role === 'ADMIN' || membership.role === 'HEAD');
        let families;
        if (isAdmin) {
            families = await this.prisma.family.findMany({
                include: {
                    memberships: {
                        include: {
                            member: {
                                include: {
                                    parents: {
                                        select: { id: true, name: true, gender: true, status: true },
                                    },
                                    children: {
                                        select: { id: true, name: true, gender: true, status: true },
                                    },
                                    spouses: {
                                        select: { id: true, name: true, gender: true, status: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
        }
        else {
            const familyIds = member.familyMemberships.map(m => m.familyId);
            families = await this.prisma.family.findMany({
                where: { id: { in: familyIds } },
                include: {
                    memberships: {
                        include: {
                            member: {
                                include: {
                                    parents: {
                                        select: { id: true, name: true, gender: true, status: true },
                                    },
                                    children: {
                                        select: { id: true, name: true, gender: true, status: true },
                                    },
                                    spouses: {
                                        select: { id: true, name: true, gender: true, status: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
        }
        const calculateGeneration = (memberId, familyMembers, visited = new Set()) => {
            if (visited.has(memberId))
                return 0;
            visited.add(memberId);
            const member = familyMembers.find(m => m.member.id === memberId);
            if (!member)
                return 0;
            const parents = member.member.parents;
            if (parents.length === 0)
                return 0;
            const parentGenerations = parents.map((parent) => calculateGeneration(parent.id, familyMembers, new Set(visited)));
            return Math.max(...parentGenerations, 0) + 1;
        };
        const transformedFamilies = families.map(family => {
            const members = family.memberships.map(membership => {
                const generation = calculateGeneration(membership.member.id, family.memberships);
                return {
                    id: membership.member.id,
                    name: membership.member.name,
                    role: membership.role,
                    generation,
                    parents: membership.member.parents,
                    children: membership.member.children,
                    spouses: membership.member.spouses,
                    personalInfo: membership.member.personalInfo,
                };
            });
            return {
                id: family.id,
                name: family.name,
                members: members.sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name)),
            };
        });
        const allMembers = transformedFamilies.flatMap(family => family.members);
        const uniqueMembers = allMembers.filter((member, index, array) => array.findIndex(m => m.id === member.id) === index);
        return {
            families: transformedFamilies,
            membersList: uniqueMembers,
            generatedAt: new Date(),
            exportConfig: {
                formats: ['pdf', 'excel'],
                familyTree: {
                    structure: 'folderTree',
                    includeMembersList: true,
                    memberDetails: ['parent', 'children', 'spouses', 'personalInfo'],
                },
            },
        };
    }
    async exportFamilyData(memberId, exportRequest) {
        const folderTreeData = await this.getFolderTreeData(memberId);
        let familiesToExport = folderTreeData.families;
        if (exportRequest.scope === 'current-family') {
            const member = await this.prisma.member.findUnique({
                where: { id: memberId },
                include: { familyMemberships: true },
            });
            if (member && member.familyMemberships.length > 0) {
                const primaryFamilyId = member.familyMemberships[0].familyId;
                familiesToExport = folderTreeData.families.filter(f => f.id === primaryFamilyId);
            }
        }
        else if (exportRequest.scope === 'selected-families' && exportRequest.familyIds) {
            familiesToExport = folderTreeData.families.filter(f => exportRequest.familyIds.includes(f.id));
        }
        if (exportRequest.format === 'pdf') {
            return this.generatePDF(familiesToExport, exportRequest);
        }
        else if (exportRequest.format === 'excel') {
            return this.generateExcel(familiesToExport, exportRequest);
        }
        throw new common_1.BadRequestException('Unsupported export format');
    }
    async generatePDF(families, exportRequest) {
        let content = `FAMILY TREE EXPORT (PDF)\n`;
        content += `Generated on: ${new Date().toISOString()}\n`;
        content += `Structure: ${exportRequest.config.familyTree.structure}\n\n`;
        families.forEach(family => {
            content += `\nFAMILY: ${family.name}\n`;
            content += `${'='.repeat(family.name.length + 8)}\n\n`;
            if (exportRequest.config.familyTree.structure === 'folderTree') {
                const generations = {};
                family.members.forEach((member) => {
                    if (!generations[member.generation]) {
                        generations[member.generation] = [];
                    }
                    generations[member.generation].push(member);
                });
                Object.keys(generations)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .forEach(generation => {
                    content += `Generation ${generation}:\n`;
                    generations[generation].forEach(member => {
                        content += `  - ${member.name} (${member.role})\n`;
                        if (exportRequest.includeData.relationships) {
                            if (member.parents.length > 0) {
                                content += `    Parents: ${member.parents.map((p) => p.name).join(', ')}\n`;
                            }
                            if (member.children.length > 0) {
                                content += `    Children: ${member.children.map((c) => c.name).join(', ')}\n`;
                            }
                            if (member.spouses.length > 0) {
                                content += `    Spouses: ${member.spouses.map((s) => s.name).join(', ')}\n`;
                            }
                        }
                        if (exportRequest.includeData.personalInfo && member.personalInfo) {
                            const info = member.personalInfo;
                            if (info.bio)
                                content += `    Bio: ${info.bio}\n`;
                            if (info.birthDate)
                                content += `    Birth Date: ${info.birthDate}\n`;
                            if (info.occupation)
                                content += `    Occupation: ${info.occupation}\n`;
                        }
                        content += '\n';
                    });
                    content += '\n';
                });
            }
            else {
                family.members.forEach((member) => {
                    content += `- ${member.name} (${member.role})\n`;
                });
            }
        });
        return Buffer.from(content, 'utf-8');
    }
    async generateExcel(families, exportRequest) {
        let content = 'Family Name,Member Name,Role,Generation,Parents,Children,Spouses';
        if (exportRequest.includeData.personalInfo) {
            content += ',Bio,Birth Date,Occupation';
        }
        content += '\n';
        families.forEach(family => {
            family.members.forEach((member) => {
                let row = `"${family.name}","${member.name}","${member.role}",${member.generation}`;
                if (exportRequest.includeData.relationships) {
                    const parents = member.parents.map((p) => p.name).join('; ');
                    const children = member.children.map((c) => c.name).join('; ');
                    const spouses = member.spouses.map((s) => s.name).join('; ');
                    row += `,"${parents}","${children}","${spouses}"`;
                }
                else {
                    row += ',"","",""';
                }
                if (exportRequest.includeData.personalInfo && member.personalInfo) {
                    const info = member.personalInfo;
                    const bio = (info.bio || '').replace(/"/g, '""');
                    const birthDate = info.birthDate || '';
                    const occupation = info.occupation || '';
                    row += `,"${bio}","${birthDate}","${occupation}"`;
                }
                else if (exportRequest.includeData.personalInfo) {
                    row += ',"","",""';
                }
                content += row + '\n';
            });
        });
        return Buffer.from(content, 'utf-8');
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportService);
//# sourceMappingURL=export.service.js.map