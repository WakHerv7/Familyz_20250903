"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { MemberWithRelationships, Gender, MemberStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RelationshipManager from "@/components/RelationshipManager";
import { Users, Heart, UserCheck } from "lucide-react";

interface TreeNodeProps {
  member: MemberWithRelationships;
  isCurrentUser?: boolean;
  onMemberClick?: (member: MemberWithRelationships) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  member,
  isCurrentUser,
  onMemberClick,
}) => {
  const getGenderColor = (gender?: Gender) => {
    switch (gender) {
      case Gender.MALE:
        return "bg-blue-100 text-blue-800";
      case Gender.FEMALE:
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: MemberStatus) => {
    switch (status) {
      case MemberStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case MemberStatus.DECEASED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`p-3 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
        isCurrentUser
          ? "border-green-500 bg-green-50"
          : "border-gray-200 bg-white"
      }`}
      onClick={() => onMemberClick?.(member)}
    >
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarFallback className={getGenderColor(member.gender)}>
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{member.name}</p>
          <div className="flex space-x-1 mt-1">
            {member.gender && (
              <Badge variant="outline" className="text-xs">
                {member.gender}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-xs ${getStatusColor(member.status)}`}
            >
              {member.status}
            </Badge>
          </div>
        </div>
      </div>
      {isCurrentUser && <Badge className="mt-2 text-xs">You</Badge>}
    </div>
  );
};

interface FamilyTreeProps {
  currentMember: MemberWithRelationships;
  onRelationshipChange?: () => void;
}

export default function FamilyTree({
  currentMember,
  onRelationshipChange,
}: FamilyTreeProps) {
  const [selectedMember, setSelectedMember] =
    useState<MemberWithRelationships | null>(null);

  // Fetch member details when clicked
  const { data: selectedMemberDetails, isLoading: loadingMemberDetails } =
    useQuery({
      queryKey: ["member-details", selectedMember?.id],
      queryFn: async () => {
        if (!selectedMember?.id || selectedMember.id === currentMember.id) {
          return selectedMember;
        }
        const response = await apiClient.get<MemberWithRelationships>(
          `/members/${selectedMember.id}`
        );
        return response;
      },
      enabled: !!selectedMember,
    });

  const handleMemberClick = (member: MemberWithRelationships) => {
    setSelectedMember(member);
  };

  const handleRelationshipChange = () => {
    onRelationshipChange?.();
    // Also refresh the selected member details if needed
    if (selectedMember && selectedMember.id !== currentMember.id) {
      // The query will automatically refetch due to cache invalidation
    }
  };

  const displayedSelectedMember = selectedMemberDetails || selectedMember;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 grid-cols-6  gap-6">
        {/* Family Tree Visualization */}
        <div className="col-span-4 space-y-6">
          <Card>
            <CardHeader>
              {/* <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Family Tree</span>
              </CardTitle> */}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Parents Section */}
                {currentMember.parents && currentMember.parents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <span className="mr-2">👨‍👩‍👧‍👦</span>
                      Parents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentMember.parents.map((parent) => (
                        <TreeNode
                          key={parent.id}
                          member={parent as MemberWithRelationships}
                          onMemberClick={handleMemberClick}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Current User Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">👤</span>
                    You
                  </h3>
                  <div className="max-w-md">
                    <TreeNode
                      member={currentMember}
                      isCurrentUser={true}
                      onMemberClick={handleMemberClick}
                    />
                  </div>
                </div>

                {/* Spouses Section */}
                {currentMember.spouses && currentMember.spouses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <span className="mr-2">💑</span>
                      {currentMember.spouses.length === 1
                        ? "Spouse"
                        : "Spouses"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentMember.spouses.map((spouse) => (
                        <TreeNode
                          key={spouse.id}
                          member={spouse as MemberWithRelationships}
                          onMemberClick={handleMemberClick}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Children Section */}
                {currentMember.children &&
                  currentMember.children.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">👶</span>
                        Children
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentMember.children.map((child) => (
                          <TreeNode
                            key={child.id}
                            member={child as MemberWithRelationships}
                            onMemberClick={handleMemberClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* No relationships message */}
                {(!currentMember.parents ||
                  currentMember.parents.length === 0) &&
                  (!currentMember.spouses ||
                    currentMember.spouses.length === 0) &&
                  (!currentMember.children ||
                    currentMember.children.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg mb-2">🌱</p>
                      <p>No family relationships added yet.</p>
                      <p className="text-sm">
                        Start by adding family members to build your tree!
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relationship Manager */}
        <div className="col-span-2">
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Manage Relationships</span>
              </CardTitle>
            </CardHeader>
            <CardContent> */}
          <RelationshipManager
            currentMember={currentMember}
            familyId={currentMember.familyMemberships[0]?.familyId}
            onRelationshipChange={handleRelationshipChange}
          />
          {/* </CardContent>
          </Card> */}
        </div>
      </div>

      {/* Member Details Modal/Card */}
      {selectedMember && selectedMember.id !== currentMember.id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>Family Member Details</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMember(null)}
                disabled={loadingMemberDetails}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMemberDetails ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading member details...</p>
              </div>
            ) : displayedSelectedMember ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="relationships">Relationships</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {displayedSelectedMember.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {displayedSelectedMember.name}
                      </h3>
                      <div className="flex space-x-2">
                        {displayedSelectedMember.gender && (
                          <Badge variant="outline">
                            {displayedSelectedMember.gender}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {displayedSelectedMember.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {displayedSelectedMember.personalInfo && (
                    <div>
                      <h4 className="font-medium mb-2">Personal Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {displayedSelectedMember.personalInfo.bio && (
                          <p>
                            <strong>Bio:</strong>{" "}
                            {displayedSelectedMember.personalInfo.bio}
                          </p>
                        )}
                        {displayedSelectedMember.personalInfo.birthDate && (
                          <p>
                            <strong>Birth Date:</strong>{" "}
                            {new Date(
                              displayedSelectedMember.personalInfo.birthDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {displayedSelectedMember.personalInfo.birthPlace && (
                          <p>
                            <strong>Birth Place:</strong>{" "}
                            {displayedSelectedMember.personalInfo.birthPlace}
                          </p>
                        )}
                        {displayedSelectedMember.personalInfo.occupation && (
                          <p>
                            <strong>Occupation:</strong>{" "}
                            {displayedSelectedMember.personalInfo.occupation}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show relationships if available */}
                  <div className="space-y-3">
                    {displayedSelectedMember.parents &&
                      displayedSelectedMember.parents.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Parents</h4>
                          <div className="text-sm text-gray-600">
                            {displayedSelectedMember.parents
                              .map((parent) => parent.name)
                              .join(", ")}
                          </div>
                        </div>
                      )}

                    {displayedSelectedMember.spouses &&
                      displayedSelectedMember.spouses.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Spouses</h4>
                          <div className="text-sm text-gray-600">
                            {displayedSelectedMember.spouses
                              .map((spouse) => spouse.name)
                              .join(", ")}
                          </div>
                        </div>
                      )}

                    {displayedSelectedMember.children &&
                      displayedSelectedMember.children.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Children</h4>
                          <div className="text-sm text-gray-600">
                            {displayedSelectedMember.children
                              .map((child) => child.name)
                              .join(", ")}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Created:</span>
                      <p className="text-gray-600">
                        {new Date(
                          displayedSelectedMember.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>
                      <p className="text-gray-600">
                        {new Date(
                          displayedSelectedMember.updatedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="relationships">
                  <RelationshipManager
                    currentMember={displayedSelectedMember}
                    familyId={
                      displayedSelectedMember.familyMemberships[0]?.familyId
                    }
                    onRelationshipChange={handleRelationshipChange}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-gray-500">Failed to load member details.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
