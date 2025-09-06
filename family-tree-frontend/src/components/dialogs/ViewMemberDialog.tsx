"use client";

import { useState, useEffect } from "react";
import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogDescription,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogClose,
} from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
import { useMemberRelationships } from "@/hooks/api";
import { Member, RelationshipType } from "@/types";
import { ClipLoader } from "react-spinners";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Users,
  Briefcase,
  ExternalLink,
} from "lucide-react";

interface ViewMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
}

export default function ViewMemberDialog({
  open,
  onOpenChange,
  memberId,
}: ViewMemberDialogProps) {
  const { data: memberData, isLoading } = useMemberRelationships(
    memberId || "",
    1
  );

  console.log("memberData :: ", memberData);

  const member = memberData?.member;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default" as const;
      case "INACTIVE":
        return "secondary" as const;
      case "DECEASED":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case "MALE":
        return "♂";
      case "FEMALE":
        return "♀";
      default:
        return "⚲";
    }
  };

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return "Not specified";
    return new Date(dateValue).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <CustomDialog open={open} onOpenChange={onOpenChange}>
        <CustomDialogContent>
          <div className="flex items-center justify-center py-8">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        </CustomDialogContent>
      </CustomDialog>
    );
  }

  if (!member) {
    return (
      <CustomDialog open={open} onOpenChange={onOpenChange}>
        <CustomDialogContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Member not found</p>
          </div>
        </CustomDialogContent>
      </CustomDialog>
    );
  }

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Member Information</span>
          </CustomDialogTitle>
          <CustomDialogDescription>
            View detailed information about {member.name}
          </CustomDialogDescription>
          <CustomDialogClose onClick={() => onOpenChange(false)} />
        </CustomDialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  {member.personalInfo?.profileImage ? (
                    <img
                      src={member.personalInfo.profileImage}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-xl">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold">{member.name}</h2>
                    <span className="text-2xl">
                      {getGenderIcon(member.gender)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      {member.status}
                    </Badge>
                    {member.familyMemberships &&
                      member.familyMemberships.length > 0 && (
                        <Badge variant="outline">
                          {member.familyMemberships[0].role}
                        </Badge>
                      )}
                  </div>

                  {member.personalInfo?.bio && (
                    <p className="text-gray-600 mt-2">
                      {member.personalInfo.bio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-gray-600">
                      {member.gender || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Birth Date</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(member.personalInfo?.birthDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Birth Place</p>
                    <p className="text-sm text-gray-600">
                      {member.personalInfo?.birthPlace || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Occupation</p>
                    <p className="text-sm text-gray-600">
                      {member.personalInfo?.occupation || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(member.personalInfo?.email ||
            member.personalInfo?.phoneNumber ||
            member.personalInfo?.socialLinks) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {member.personalInfo?.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">
                        {member.personalInfo.email}
                      </p>
                    </div>
                  </div>
                )}

                {member.personalInfo?.phoneNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-gray-600">
                        {member.personalInfo.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {member.personalInfo?.socialLinks && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Social Media</p>
                    <div className="space-y-1">
                      {member.personalInfo.socialLinks.facebook && (
                        <a
                          href={member.personalInfo.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Facebook</span>
                        </a>
                      )}
                      {member.personalInfo.socialLinks.twitter && (
                        <a
                          href={member.personalInfo.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Twitter</span>
                        </a>
                      )}
                      {member.personalInfo.socialLinks.linkedin && (
                        <a
                          href={member.personalInfo.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {member.personalInfo.socialLinks.instagram && (
                        <a
                          href={member.personalInfo.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Relationships */}
          {memberData &&
            (memberData.parents.length > 0 ||
              memberData.spouses.length > 0 ||
              memberData.children.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>Relationships</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Parents */}
                    {memberData.parents.map(
                      (parent: { name: string }, index: number) => (
                        <div
                          key={`parent-${index}`}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(parent.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {parent.name}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                Parent
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* Spouses */}
                    {memberData.spouses.map(
                      (spouse: { name: string }, index: number) => (
                        <div
                          key={`spouse-${index}`}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(spouse.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {spouse.name}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                Spouse
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* Children */}
                    {memberData.children.map(
                      (child: { name: string }, index: number) => (
                        <div
                          key={`child-${index}`}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(child.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {child.name}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                Child
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Family Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Family Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Family</p>
                  <p className="text-sm text-gray-600">
                    {member.familyMemberships &&
                    member.familyMemberships.length > 0
                      ? member.familyMemberships[0].familyName
                      : "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(member.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(member.updatedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Member ID</p>
                  <p className="text-sm text-gray-600 font-mono">{member.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </CustomDialogContent>
    </CustomDialog>
  );
}
