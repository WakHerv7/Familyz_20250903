import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyRole } from '@prisma/client';

interface ExportConfig {
  formats: ('pdf' | 'excel')[];
  familyTree: {
    structure: 'folderTree' | 'traditional' | 'interactive';
    includeMembersList: boolean;
    memberDetails: ('parent' | 'children' | 'spouses' | 'personalInfo' | 'contact')[];
  };
}

interface ExportRequest {
  format: 'pdf' | 'excel';
  scope: 'current-family' | 'all-families' | 'selected-families';
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
    }[];
  }[];
  membersList: any[];
  generatedAt: Date;
  exportConfig: ExportConfig;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async getFolderTreeData(memberId: string): Promise<FolderTreeExportData> {
    // Get the member and their family memberships
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
      throw new BadRequestException('Member not found');
    }

    // Check if user is admin (can access all families)
    const isAdmin = member.familyMemberships.some(
      membership => membership.role === 'ADMIN' || membership.role === 'HEAD'
    );

    let families;
    if (isAdmin) {
      // Admin can see all families
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
    } else {
      // Regular member can only see their families
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

    // Calculate generations for each member
    const calculateGeneration = (memberId: string, familyMembers: any[], visited = new Set()): number => {
      if (visited.has(memberId)) return 0;
      visited.add(memberId);

      const member = familyMembers.find(m => m.member.id === memberId);
      if (!member) return 0;

      const parents = member.member.parents;
      if (parents.length === 0) return 0;

      const parentGenerations = parents.map((parent: any) =>
        calculateGeneration(parent.id, familyMembers, new Set(visited))
      );

      return Math.max(...parentGenerations, 0) + 1;
    };

    // Transform families data
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

    // Get all unique members for members list
    const allMembers = transformedFamilies.flatMap(family => family.members);
    const uniqueMembers = allMembers.filter(
      (member, index, array) => array.findIndex(m => m.id === member.id) === index
    );

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

  async exportFamilyData(memberId: string, exportRequest: ExportRequest): Promise<Buffer> {
    // Get folder tree data
    const folderTreeData = await this.getFolderTreeData(memberId);

    // Filter families based on scope
    let familiesToExport = folderTreeData.families;

    if (exportRequest.scope === 'current-family') {
      // Get user's first family (their main family)
      const member = await this.prisma.member.findUnique({
        where: { id: memberId },
        include: { familyMemberships: true },
      });

      if (member && member.familyMemberships.length > 0) {
        const primaryFamilyId = member.familyMemberships[0].familyId;
        familiesToExport = folderTreeData.families.filter(f => f.id === primaryFamilyId);
      }
    } else if (exportRequest.scope === 'selected-families' && exportRequest.familyIds) {
      familiesToExport = folderTreeData.families.filter(f =>
        exportRequest.familyIds!.includes(f.id)
      );
    }

    // Generate export based on format
    if (exportRequest.format === 'pdf') {
      return this.generatePDF(familiesToExport, exportRequest);
    } else if (exportRequest.format === 'excel') {
      return this.generateExcel(familiesToExport, exportRequest);
    }

    throw new BadRequestException('Unsupported export format');
  }

  private async generatePDF(families: any[], exportRequest: ExportRequest): Promise<Buffer> {
    // For now, return a simple text-based "PDF" representation
    // In a real implementation, you would use libraries like puppeteer, jsPDF, or PDFKit

    let content = `FAMILY TREE EXPORT (PDF)\n`;
    content += `Generated on: ${new Date().toISOString()}\n`;
    content += `Structure: ${exportRequest.config.familyTree.structure}\n\n`;

    families.forEach(family => {
      content += `\nFAMILY: ${family.name}\n`;
      content += `${'='.repeat(family.name.length + 8)}\n\n`;

      if (exportRequest.config.familyTree.structure === 'folderTree') {
        // Group by generations
        const generations: { [key: number]: any[] } = {};
        family.members.forEach((member: any) => {
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
                  content += `    Parents: ${member.parents.map((p: any) => p.name).join(', ')}\n`;
                }
                if (member.children.length > 0) {
                  content += `    Children: ${member.children.map((c: any) => c.name).join(', ')}\n`;
                }
                if (member.spouses.length > 0) {
                  content += `    Spouses: ${member.spouses.map((s: any) => s.name).join(', ')}\n`;
                }
              }

              if (exportRequest.includeData.personalInfo && member.personalInfo) {
                const info = member.personalInfo as any;
                if (info.bio) content += `    Bio: ${info.bio}\n`;
                if (info.birthDate) content += `    Birth Date: ${info.birthDate}\n`;
                if (info.occupation) content += `    Occupation: ${info.occupation}\n`;
              }
              content += '\n';
            });
            content += '\n';
          });
      } else {
        // Simple list format
        family.members.forEach((member: any) => {
          content += `- ${member.name} (${member.role})\n`;
        });
      }
    });

    // Convert to buffer (in real implementation, this would be actual PDF bytes)
    return Buffer.from(content, 'utf-8');
  }

  private async generateExcel(families: any[], exportRequest: ExportRequest): Promise<Buffer> {
    // For now, return a simple CSV-like representation
    // In a real implementation, you would use libraries like exceljs

    let content = 'Family Name,Member Name,Role,Generation,Parents,Children,Spouses';

    if (exportRequest.includeData.personalInfo) {
      content += ',Bio,Birth Date,Occupation';
    }

    content += '\n';

    families.forEach(family => {
      family.members.forEach((member: any) => {
        let row = `"${family.name}","${member.name}","${member.role}",${member.generation}`;

        if (exportRequest.includeData.relationships) {
          const parents = member.parents.map((p: any) => p.name).join('; ');
          const children = member.children.map((c: any) => c.name).join('; ');
          const spouses = member.spouses.map((s: any) => s.name).join('; ');
          row += `,"${parents}","${children}","${spouses}"`;
        } else {
          row += ',"","",""';
        }

        if (exportRequest.includeData.personalInfo && member.personalInfo) {
          const info = member.personalInfo as any;
          const bio = (info.bio || '').replace(/"/g, '""');
          const birthDate = info.birthDate || '';
          const occupation = info.occupation || '';
          row += `,"${bio}","${birthDate}","${occupation}"`;
        } else if (exportRequest.includeData.personalInfo) {
          row += ',"","",""';
        }

        content += row + '\n';
      });
    });

    // Convert to buffer (in real implementation, this would be actual Excel bytes)
    return Buffer.from(content, 'utf-8');
  }
}
