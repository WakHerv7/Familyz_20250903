"use client";

import { useState } from "react";
import { useMemberRelationships } from "@/hooks/api";
import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogDescription,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogClose,
} from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import {
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Heart,
  Users,
  Crown,
  Shield,
} from "lucide-react";
import { MemberWithRelationships, Gender, MemberStatus } from "@/types";

interface MemberDetailsDialogProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MemberDetailsDialog({
  memberId,
  open,
  onOpenChange,
}: MemberDetailsDialogProps) {
  const {
    data: memberData,
    isLoading,
    error,
  } = useMemberRelationships(memberId || "", 2);
  const member = memberData?.member;

  const getGenderIcon = (gender?: Gender) => {
    switch (gender) {
      case "MALE":
        return "👨";
      case "FEMALE":
        return "👩";
      default:
        return "🧑";
    }
  };

  const getStatusColor = (status: MemberStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DECEASED":
        return "bg-red-100 text-red-800 border-red-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading member details</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        ) : member ? (
          <>
            <CustomDialogHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
                  {getGenderIcon(member.gender)}
                </div>
                <div className="flex-1">
                  <CustomDialogTitle className="text-2xl font-bold text-gray-900">
                    {member.name}
                  </CustomDialogTitle>
                  <CustomDialogDescription className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                    {member.gender && (
                      <span className="text-gray-600">
                        {member.gender.charAt(0) +
                          member.gender.slice(1).toLowerCase()}
                      </span>
                    )}
                  </CustomDialogDescription>
                </div>
              </div>
              <CustomDialogClose onClick={() => onOpenChange(false)} />
            </CustomDialogHeader>

            <div className="space-y-6 mt-6">
              {/* Personal Information */}
              {member.personalInfo && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {member.personalInfo.bio && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                        <p className="text-gray-600 text-sm">
                          {member.personalInfo.bio}
                        </p>
                      </div>
                    )}
                    {member.personalInfo.birthDate && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-green-600" />
                          Birth Date
                        </h4>
                        <p className="text-gray-600">
                          {new Date(
                            member.personalInfo.birthDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {member.personalInfo.birthPlace && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-red-600" />
                          Birth Place
                        </h4>
                        <p className="text-gray-600">
                          {member.personalInfo.birthPlace}
                        </p>
                      </div>
                    )}
                    {member.personalInfo.occupation && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-purple-600" />
                          Occupation
                        </h4>
                        <p className="text-gray-600">
                          {member.personalInfo.occupation}
                        </p>
                      </div>
                    )}
                    {member.personalInfo.phoneNumber && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-blue-600" />
                          Phone
                        </h4>
                        <p className="text-gray-600">
                          {member.personalInfo.phoneNumber}
                        </p>
                      </div>
                    )}
                    {member.personalInfo.email && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-orange-600" />
                          Email
                        </h4>
                        <p className="text-gray-600">
                          {member.personalInfo.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Family Memberships */}
              {member.familyMemberships &&
                member.familyMemberships.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-green-600" />
                        Family Memberships
                      </h3>
                      <div className="space-y-3">
                        {member.familyMemberships.map((membership: any) => (
                          <div
                            key={membership.id}
                            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {membership.familyName}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {membership.role === "ADMIN" && (
                                  <Badge className="bg-purple-100 text-purple-800">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                                {membership.role === "HEAD" && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Head
                                  </Badge>
                                )}
                                {membership.role === "MEMBER" && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    <Users className="h-3 w-3 mr-1" />
                                    Member
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Joined:</span>{" "}
                              {new Date(
                                membership.joinDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              {/* Relationships */}
              {(member.parents.length > 0 ||
                member.children.length > 0 ||
                member.spouses.length > 0) && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-red-600" />
                      Relationships
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {member.parents.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                          <h4 className="font-medium text-red-900 mb-2 flex items-center">
                            <Heart className="h-4 w-4 mr-2" />
                            Parents ({member.parents.length})
                          </h4>
                          <div className="space-y-1">
                            {member.parents.slice(0, 3).map((parent: any) => (
                              <p
                                key={parent.id}
                                className="text-sm text-red-700"
                              >
                                {parent.name}
                              </p>
                            ))}
                            {member.parents.length > 3 && (
                              <p className="text-xs text-red-600">
                                +{member.parents.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {member.spouses.length > 0 && (
                        <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                          <h4 className="font-medium text-pink-900 mb-2 flex items-center">
                            <Heart className="h-4 w-4 mr-2" />
                            Spouses ({member.spouses.length})
                          </h4>
                          <div className="space-y-1">
                            {member.spouses.slice(0, 3).map((spouse: any) => (
                              <p
                                key={spouse.id}
                                className="text-sm text-pink-700"
                              >
                                {spouse.name}
                              </p>
                            ))}
                            {member.spouses.length > 3 && (
                              <p className="text-xs text-pink-600">
                                +{member.spouses.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {member.children.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Children ({member.children.length})
                          </h4>
                          <div className="space-y-1">
                            {member.children.slice(0, 3).map((child: any) => (
                              <p
                                key={child.id}
                                className="text-sm text-blue-700"
                              >
                                {child.name}
                              </p>
                            ))}
                            {member.children.length > 3 && (
                              <p className="text-xs text-blue-600">
                                +{member.children.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Account Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                  Account Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">
                        Member ID:
                      </span>
                      <p className="text-gray-600 font-mono text-xs mt-1">
                        {member.id}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        Created:
                      </span>
                      <p className="text-gray-600">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        Last Updated:
                      </span>
                      <p className="text-gray-600">
                        {new Date(member.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </>
        ) : null}
      </CustomDialogContent>
    </CustomDialog>
  );
}
