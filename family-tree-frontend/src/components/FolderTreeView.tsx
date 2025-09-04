'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { MemberWithRelationships, Gender, FamilyRole, MemberStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Folder, FolderOpen, User, Users, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderTreeNode {
  id: string;
  name: string;
  type: 'family' | 'generation' | 'member';
  level: number;
  expanded: boolean;
  children: FolderTreeNode[];
  member?: MemberWithRelationships;
  familyId?: string;
  generation?: number;
}

interface FolderTreeViewProps {
  currentMember: MemberWithRelationships;
  isAdmin?: boolean;
  onMemberClick?: (member: MemberWithRelationships) => void;
}

export default function FolderTreeView({ currentMember, isAdmin = false, onMemberClick }: FolderTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  // Fetch all family members if user is admin
  const { data: allFamilyMembers = [] } = useQuery({
    queryKey: ['all-family-members'],
    queryFn: async () => {
      if (!isAdmin) return [];
      const response = await apiClient.get<MemberWithRelationships[]>('/members/all');
      return response;
    },
    enabled: isAdmin,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGenderIcon = (gender?: Gender) => {
    switch (gender) {
      case Gender.MALE:
        return '👨';
      case Gender.FEMALE:
        return '👩';
      default:
        return '👤';
    }
  };

  const getRoleIcon = (role?: FamilyRole) => {
    switch (role) {
      case FamilyRole.HEAD:
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case FamilyRole.ADMIN:
        return <Shield className="h-3 w-3 text-blue-600" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const buildFolderTree = (): FolderTreeNode[] => {
    const membersToProcess = isAdmin ? allFamilyMembers : [currentMember, ...getFamilyMembers(currentMember)];

    // Group by families
    const familyGroups = new Map<string, MemberWithRelationships[]>();

    membersToProcess.forEach(member => {
      member.familyMemberships?.forEach(membership => {
        if (!familyGroups.has(membership.familyId)) {
          familyGroups.set(membership.familyId, []);
        }
        familyGroups.get(membership.familyId)!.push(member);
      });
    });

    const tree: FolderTreeNode[] = [];

    familyGroups.forEach((members, familyId) => {
      const familyName = members[0]?.familyMemberships?.find(m => m.familyId === familyId)?.familyName || 'Unknown Family';

      // Create family node
      const familyNode: FolderTreeNode = {
        id: `family-${familyId}`,
        name: familyName,
        type: 'family',
        level: 0,
        expanded: expandedNodes.has(`family-${familyId}`),
        children: [],
        familyId,
      };

      // Group members by generation relative to current member
      const generationGroups = new Map<number, MemberWithRelationships[]>();

      members.forEach(member => {
        const generation = calculateGeneration(member, currentMember);
        if (!generationGroups.has(generation)) {
          generationGroups.set(generation, []);
        }
        generationGroups.get(generation)!.push(member);
      });

      // Sort generations
      const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b);

      sortedGenerations.forEach(gen => {
        const genMembers = generationGroups.get(gen)!;
        const genName = getGenerationName(gen);

        const generationNode: FolderTreeNode = {
          id: `generation-${familyId}-${gen}`,
          name: `${genName} (${genMembers.length})`,
          type: 'generation',
          level: 1,
          expanded: expandedNodes.has(`generation-${familyId}-${gen}`),
          children: [],
          generation: gen,
        };

        // Add members to generation
        genMembers.forEach(member => {
          const memberNode: FolderTreeNode = {
            id: `member-${member.id}`,
            name: member.name,
            type: 'member',
            level: 2,
            expanded: false,
            children: [],
            member,
          };
          generationNode.children.push(memberNode);
        });

        familyNode.children.push(generationNode);
      });

      tree.push(familyNode);
    });

    return tree;
  };

  const getFamilyMembers = (member: MemberWithRelationships): MemberWithRelationships[] => {
    const members: MemberWithRelationships[] = [];
    const seen = new Set<string>([member.id]);

    const addMembers = (memberList: any[]) => {
      memberList?.forEach(m => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          members.push(m);
        }
      });
    };

    addMembers(member.parents || []);
    addMembers(member.children || []);
    addMembers(member.spouses || []);

    return members;
  };

  const calculateGeneration = (member: MemberWithRelationships, reference: MemberWithRelationships): number => {
    if (member.id === reference.id) return 0;

    // Simple generation calculation based on relationships
    if (reference.parents?.some(p => p.id === member.id)) return -1;
    if (reference.children?.some(c => c.id === member.id)) return 1;
    if (reference.spouses?.some(s => s.id === member.id)) return 0;

    // Check for grandparents/grandchildren through parents
    if (reference.parents?.some(parent =>
      (parent as any).parents?.some((grandparent: any) => grandparent.id === member.id)
    )) return -2;

    if (reference.children?.some(child =>
      (child as any).children?.some((grandchild: any) => grandchild.id === member.id)
    )) return 2;

    return 0; // Default to same generation
  };

  const getGenerationName = (generation: number): string => {
    switch (generation) {
      case -2: return 'Great Grandparents';
      case -1: return 'Parents';
      case 0: return 'Current Generation';
      case 1: return 'Children';
      case 2: return 'Grandchildren';
      default:
        if (generation < -2) return `Generation -${Math.abs(generation)}`;
        if (generation > 2) return `Generation +${generation}`;
        return 'Unknown Generation';
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: FolderTreeNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indentLevel = node.level * 20;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer transition-colors",
            node.type === 'member' && node.member?.id === currentMember.id && "bg-blue-50 border-l-2 border-blue-500"
          )}
          style={{ marginLeft: `${indentLevel}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            } else if (node.member) {
              onMemberClick?.(node.member);
            }
          }}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 mr-1 flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )
            ) : null}
          </div>

          {/* Node Icon */}
          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            {node.type === 'family' && (
              isExpanded ? <FolderOpen className="h-4 w-4 text-blue-600" /> : <Folder className="h-4 w-4 text-blue-600" />
            )}
            {node.type === 'generation' && (
              <Users className="h-4 w-4 text-green-600" />
            )}
            {node.type === 'member' && node.member && (
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs" style={{ fontSize: '8px' }}>
                  {getInitials(node.member.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Node Content */}
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{node.name}</span>

              {node.type === 'member' && node.member && (
                <div className="flex items-center space-x-1">
                  {getRoleIcon(node.member.familyMemberships?.[0]?.role)}
                  <span className="text-xs">{getGenderIcon(node.member.gender)}</span>
                  {node.member.status === MemberStatus.DECEASED && (
                    <Badge variant="outline" className="text-xs">†</Badge>
                  )}
                  {node.member.id === currentMember.id && (
                    <Badge variant="default" className="text-xs">You</Badge>
                  )}
                </div>
              )}
            </div>

            {node.type === 'family' && (
              <Badge variant="outline" className="text-xs">
                {node.children.reduce((count, gen) => count + gen.children.length, 0)} members
              </Badge>
            )}
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildFolderTree();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Folder className="h-5 w-5" />
          <span>Family Tree Explorer</span>
          {isAdmin && <Badge variant="outline">Admin View</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {tree.length > 0 ? (
            tree.map(node => renderNode(node))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No family data available</p>
              <p className="text-sm">Add family members to see the tree structure</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          <p><strong>Legend:</strong></p>
          <div className="flex flex-wrap gap-4 mt-1">
            <span className="flex items-center"><Folder className="h-3 w-3 mr-1" /> Family</span>
            <span className="flex items-center"><Users className="h-3 w-3 mr-1" /> Generation</span>
            <span className="flex items-center"><Crown className="h-3 w-3 mr-1" /> Head</span>
            <span className="flex items-center"><Shield className="h-3 w-3 mr-1" /> Admin</span>
            <span>† Deceased</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
