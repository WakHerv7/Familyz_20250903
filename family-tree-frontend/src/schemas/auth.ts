import { z } from "zod";
import { Gender, RegistrationType } from "@/types";

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Valid email is required")
      .optional()
      .or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    name: z.string().min(1, "Name is required"),
    gender: z.nativeEnum(Gender).optional(),
    registrationType: z.nativeEnum(RegistrationType),
    familyName: z.string().optional(),
    familyDescription: z.string().optional(),
    invitationCode: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
    path: ["email"],
  })
  .refine(
    (data) => {
      if (data.registrationType === RegistrationType.CREATE_FAMILY) {
        return !!data.familyName;
      }
      return true;
    },
    {
      message: "Family name is required when creating a new family",
      path: ["familyName"],
    }
  )
  .refine(
    (data) => {
      if (data.registrationType === RegistrationType.JOIN_FAMILY) {
        return !!data.invitationCode;
      }
      return true;
    },
    {
      message: "Invitation code is required when joining a family",
      path: ["invitationCode"],
    }
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
