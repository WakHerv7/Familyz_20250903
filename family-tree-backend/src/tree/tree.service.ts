import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  FamilyTreeDto,
  TreeNodeDto,
  TreeConnectionDto,
  ExportTreeDto,
  TreeStatisticsDto,
  TreeFormat
} from './dto/tree.dto';

@Injectable()
export class TreeService {
  constructor(private prisma: PrismaService) {}

  async getFamilyTree(user: AuthenticatedUser, familyId: string, centerMemberId?: string): Promise<FamilyTreeDto> {
    // Verify family access
    await this.verifyFamilyAccess(user, familyId);

    // Get family information
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { name: true },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Get all family members with privacy filtering
    const members = await this.getVisibleMembers(user, familyId);

    // Set center node (default to current user's member if not specified)
    const centerNodeId = centerMemberId || user.memberId || members[0]?.id;

    // Build tree structure
    const { nodes, connections } = await this.buildTreeStructure(members, centerNodeId);

    // Calculate statistics
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

  async getTreeStatistics(user: AuthenticatedUser, familyId: string): Promise<TreeStatisticsDto> {
    await this.verifyFamilyAccess(user, familyId);

    const members = await this.getVisibleMembers(user, familyId);

    // Count families (including sub-families)
    const families = await this.prisma.family.findMany({
      where: {
        OR: [
          { id: familyId },
          { parentFamilyId: familyId },
        ],
      },
    });

    // Calculate statistics
    const totalMembers = members.length;
    const totalFamilies = families.length;

    // Gender distribution
    const genderDistribution = {
      male: members.filter(m => m.gender === 'MALE').length,
      female: members.filter(m => m.gender === 'FEMALE').length,
      other: members.filter(m => m.gender === 'OTHER').length,
      unspecified: members.filter(m => !m.gender || m.gender === 'PREFER_NOT_TO_SAY').length,
    };

    // Status distribution
    const statusDistribution = {
      active: members.filter(m => m.status === 'ACTIVE').length,
      inactive: members.filter(m => m.status === 'INACTIVE').length,
      deceased: members.filter(m => m.status === 'DECEASED').length,
      archived: members.filter(m => m.status === 'ARCHIVED').length,
    };

    // Calculate average children per member
    const totalChildren = members.reduce((sum, member) => sum + (member.children?.length || 0), 0);
    const averageChildrenPerMember = totalMembers > 0 ? totalChildren / totalMembers : 0;

    // Find oldest and youngest members (if birth info is available)
    let oldestMember, youngestMember;

    for (const member of members) {
      if (member.personalInfo && typeof member.personalInfo === 'object') {
        const birthYear = (member.personalInfo as any).birthYear;
        if (typeof birthYear === 'number') {
          if (!oldestMember || birthYear < oldestMember.birthYear!) {
            oldestMember = { id: member.id, name: member.name, birthYear };
          }
          if (!youngestMember || birthYear > youngestMember.birthYear!) {
            youngestMember = { id: member.id, name: member.name, birthYear };
          }
        }
      }
    }

    // Calculate generations
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

  async exportFamilyTree(user: AuthenticatedUser, exportDto: ExportTreeDto): Promise<Buffer | string> {
    await this.verifyFamilyAccess(user, exportDto.familyId);

    const treeData = await this.getFamilyTree(user, exportDto.familyId);

    switch (exportDto.format) {
      case TreeFormat.JSON:
        return this.exportAsJson(treeData, exportDto);
      case TreeFormat.CSV:
        return this.exportAsCsv(treeData, exportDto);
      case TreeFormat.PDF:
        return this.exportAsPdf(treeData, exportDto);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async verifyFamilyAccess(user: AuthenticatedUser, familyId: string): Promise<void> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
    }

    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: user.memberId,
        familyId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied to this family');
    }
  }

  private async getVisibleMembers(user: AuthenticatedUser, familyId: string): Promise<any[]> {
    // Get all family members with relationships
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

    // Apply privacy filtering - members can only see other members in their families
    const userFamilyIds = await this.getUserFamilyIds(user.memberId!);

    return memberships
      .filter(membership => {
        // Always show if it's the same family
        if (membership.familyId === familyId) return true;

        // Check if user has access to this member through other families
        return userFamilyIds.includes(membership.familyId);
      })
      .map(membership => ({
        ...membership.member,
        // Combine spouses arrays
        spouses: [
          ...membership.member.spouses,
          ...membership.member.spousesReverse,
        ].filter((spouse, index, arr) =>
          arr.findIndex(s => s.id === spouse.id) === index
        ),
      }));
  }

  private async getUserFamilyIds(memberId: string): Promise<string[]> {
    const memberships = await this.prisma.familyMembership.findMany({
      where: {
        memberId,
        isActive: true,
      },
      select: { familyId: true },
    });

    return memberships.map(m => m.familyId);
  }

  private async buildTreeStructure(members: any[], centerNodeId: string): Promise<{
    nodes: TreeNodeDto[];
    connections: TreeConnectionDto[];
  }> {
    const nodes: TreeNodeDto[] = [];
    const connections: TreeConnectionDto[] = [];
    const processedMembers = new Set<string>();

    // Calculate positions using a hierarchical layout algorithm
    const positions = this.calculateNodePositions(members, centerNodeId);

    // Create nodes
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
        parentIds: member.parents?.map((p: any) => p.id) || [],
        childrenIds: member.children?.map((c: any) => c.id) || [],
        spouseIds: member.spouses?.map((s: any) => s.id) || [],
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });

      // Create connections
      // Parent connections
      member.parents?.forEach((parent: any) => {
        connections.push({
          from: parent.id,
          to: member.id,
          type: 'parent',
          strength: 1.0,
        });
      });

      // Spouse connections
      member.spouses?.forEach((spouse: any) => {
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

      // Child connections
      member.children?.forEach((child: any) => {
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

  private calculateNodePositions(members: any[], centerNodeId: string): Map<string, { x: number; y: number; level: number }> {
    const positions = new Map<string, { x: number; y: number; level: number }>();
    const memberMap = new Map(members.map(m => [m.id, m]));

    // Simple hierarchical layout
    const visited = new Set<string>();
    const levelWidth = 300;
    const levelHeight = 150;

    // BFS to assign levels
    const queue: Array<{ id: string; level: number; parentX?: number }> = [{ id: centerNodeId, level: 0 }];
    const levelCounts = new Map<number, number>();

    while (queue.length > 0) {
      const { id, level, parentX } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);

      const member = memberMap.get(id);
      if (!member) continue;

      // Count nodes at this level
      const currentLevelCount = levelCounts.get(level) || 0;
      levelCounts.set(level, currentLevelCount + 1);

      // Calculate position
      const x = parentX !== undefined ? parentX : currentLevelCount * levelWidth;
      const y = level * levelHeight;

      positions.set(id, { x, y, level });

      // Add children to queue
      member.children?.forEach((child: any) => {
        if (!visited.has(child.id)) {
          queue.push({ id: child.id, level: level + 1, parentX: x });
        }
      });

      // Add parents to queue (negative levels)
      member.parents?.forEach((parent: any) => {
        if (!visited.has(parent.id)) {
          queue.push({ id: parent.id, level: level - 1, parentX: x });
        }
      });

      // Add spouses to queue (same level)
      member.spouses?.forEach((spouse: any) => {
        if (!visited.has(spouse.id)) {
          queue.push({ id: spouse.id, level, parentX: x + 100 });
        }
      });
    }

    return positions;
  }

  private calculateGenerations(nodes: TreeNodeDto[], centerNodeId: string): number {
    const levels = nodes.map(node => node.level);
    const minLevel = Math.min(...levels);
    const maxLevel = Math.max(...levels);
    return maxLevel - minLevel + 1;
  }

  private exportAsJson(treeData: FamilyTreeDto, exportDto: ExportTreeDto): string {
    const filteredData = {
      ...treeData,
      nodes: treeData.nodes.map(node => ({
        ...node,
        ...(exportDto.includePersonalInfo ? {} : { personalInfo: undefined }),
      })),
    };

    return JSON.stringify(filteredData, null, 2);
  }

  private exportAsCsv(treeData: FamilyTreeDto, exportDto: ExportTreeDto): string {
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

  private exportAsPdf(treeData: FamilyTreeDto, exportDto: ExportTreeDto): Buffer {
    // This is a simplified implementation
    // In a real application, you would use a library like puppeteer or pdfkit
    const content = `Family Tree: ${treeData.familyName}\n\n` +
      `Total Members: ${treeData.totalMembers}\n` +
      `Generations: ${treeData.generations}\n\n` +
      treeData.nodes.map(node =>
        `${node.name} (${node.gender || 'Unknown'}, ${node.status})`
      ).join('\n');

    return Buffer.from(content, 'utf-8');
  }
}
