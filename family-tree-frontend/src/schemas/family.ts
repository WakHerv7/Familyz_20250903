import { z } from 'zod';

export const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required'),
  description: z.string().optional(),
});

export const createInvitationSchema = z.object({
  familyId: z.string().min(1, 'Family is required'),
  memberStub: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    note: z.string().optional(),
  }).optional(),
});

export const inviteByEmailSchema = z.object({
  email: z.string().email('Valid email is required'),
  familyId: z.string().min(1, 'Family is required'),
  personalMessage: z.string().optional(),
  memberStub: z.object({
    name: z.string().optional(),
    expectedRelationship: z.string().optional(),
  }).optional(),
});

export type CreateFamilyFormData = z.infer<typeof createFamilySchema>;
export type CreateInvitationFormData = z.infer<typeof createInvitationSchema>;
export type InviteByEmailFormData = z.infer<typeof inviteByEmailSchema>;
