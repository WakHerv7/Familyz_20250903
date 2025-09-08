import { z } from "zod";
import { Gender, MemberStatus, RelationshipType, FamilyRole } from "@/types";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.nativeEnum(Gender).optional(),
  status: z.nativeEnum(MemberStatus).optional(),
  personalInfo: z
    .object({
      bio: z.string().optional(),
      birthDate: z.string().optional(),
      birthPlace: z.string().optional(),
      occupation: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      socialLinks: z
        .object({
          facebook: z.string().url().optional().or(z.literal("")),
          twitter: z.string().url().optional().or(z.literal("")),
          linkedin: z.string().url().optional().or(z.literal("")),
          instagram: z.string().url().optional().or(z.literal("")),
        })
        .optional(),
    })
    .optional(),
});

export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.nativeEnum(Gender).optional(),
  status: z.nativeEnum(MemberStatus).optional().default(MemberStatus.ACTIVE),
  familyId: z.string().min(1, "Family is required"),
  role: z.nativeEnum(FamilyRole).optional().default(FamilyRole.MEMBER),
  personalInfo: z
    .object({
      bio: z.string().optional(),
      birthDate: z.string().optional(),
      birthPlace: z.string().optional(),
      occupation: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
    })
    .optional(),
  relationships: z
    .array(
      z.object({
        relatedMemberId: z.string(),
        relationshipType: z.nativeEnum(RelationshipType),
      })
    )
    .optional(),
});

export const addRelationshipSchema = z.object({
  relatedMemberId: z.string().min(1, "Related member is required"),
  relationshipType: z.nativeEnum(RelationshipType),
  familyId: z.string().min(1, "Family ID is required"),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type CreateMemberFormData = z.infer<typeof createMemberSchema>;
export type AddRelationshipFormData = z.infer<typeof addRelationshipSchema>;
