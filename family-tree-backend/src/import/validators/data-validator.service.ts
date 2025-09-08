import { Injectable, Logger } from "@nestjs/common";
import {
  ImportMemberData,
  ImportFamilyData,
  ValidationResult,
  ImportError,
  ImportWarning,
} from "../interfaces/import.interface";
import { Gender, MemberStatus } from "@prisma/client";

@Injectable()
export class DataValidatorService {
  private readonly logger = new Logger(DataValidatorService.name);

  validateImportData(
    data: ImportMemberData[] | ImportFamilyData[],
    familyId?: string
  ): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const validData: ImportMemberData[] = [];

    // Check if data is family or member array
    if (this.isFamilyData(data)) {
      // Handle family data
      const familyData = data as ImportFamilyData[];
      familyData.forEach((family, familyIndex) => {
        this.validateFamilyData(
          family,
          familyIndex,
          errors,
          warnings,
          validData
        );
      });
    } else {
      // Handle member data
      const memberData = data as ImportMemberData[];
      memberData.forEach((member, index) => {
        this.validateMemberData(member, index + 1, errors, warnings, validData);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validData,
    };
  }

  private isFamilyData(
    data: ImportMemberData[] | ImportFamilyData[]
  ): data is ImportFamilyData[] {
    return data.length > 0 && "members" in data[0];
  }

  private validateFamilyData(
    family: ImportFamilyData,
    familyIndex: number,
    errors: ImportError[],
    warnings: ImportWarning[],
    validData: ImportMemberData[]
  ): void {
    // Validate family name
    if (!family.name || family.name.trim().length === 0) {
      errors.push({
        row: familyIndex + 1,
        field: "familyName",
        message: "Family name is required",
      });
    } else if (family.name.length > 100) {
      errors.push({
        row: familyIndex + 1,
        field: "familyName",
        message: "Family name must be less than 100 characters",
      });
    }

    // Validate family description
    if (family.description && family.description.length > 500) {
      warnings.push({
        row: familyIndex + 1,
        field: "familyDescription",
        message: "Family description is quite long, consider shortening it",
      });
    }

    // Validate members
    if (!family.members || family.members.length === 0) {
      errors.push({
        row: familyIndex + 1,
        message: "Family must have at least one member",
      });
      return;
    }

    family.members.forEach((member, memberIndex) => {
      this.validateMemberData(
        member,
        familyIndex * 1000 + memberIndex + 1, // Create unique row number
        errors,
        warnings,
        validData
      );
    });
  }

  private validateMemberData(
    member: ImportMemberData,
    rowNumber: number,
    errors: ImportError[],
    warnings: ImportWarning[],
    validData: ImportMemberData[]
  ): void {
    let isValid = true;

    // Validate name (required)
    if (!member.name || member.name.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: "name",
        message: "Member name is required",
      });
      isValid = false;
    } else if (member.name.length > 100) {
      errors.push({
        row: rowNumber,
        field: "name",
        message: "Member name must be less than 100 characters",
      });
      isValid = false;
    }

    // Validate gender
    if (member.gender && !Object.values(Gender).includes(member.gender)) {
      errors.push({
        row: rowNumber,
        field: "gender",
        message: `Invalid gender value: ${
          member.gender
        }. Must be one of: ${Object.values(Gender).join(", ")}`,
      });
      isValid = false;
    }

    // Validate status
    if (member.status && !Object.values(MemberStatus).includes(member.status)) {
      errors.push({
        row: rowNumber,
        field: "status",
        message: `Invalid status value: ${
          member.status
        }. Must be one of: ${Object.values(MemberStatus).join(", ")}`,
      });
      isValid = false;
    }

    // Validate color
    if (member.color && !this.isValidHexColor(member.color)) {
      errors.push({
        row: rowNumber,
        field: "color",
        message: "Color must be a valid hex color code (e.g., #FF5733)",
      });
      isValid = false;
    }

    // Validate personal info
    if (member.personalInfo) {
      this.validatePersonalInfo(
        member.personalInfo,
        rowNumber,
        errors,
        warnings
      );
    }

    // Validate relationships
    if (member.parentNames && member.parentNames.length > 10) {
      warnings.push({
        row: rowNumber,
        field: "parentNames",
        message:
          "Member has many parents listed, please verify this is correct",
      });
    }

    if (member.spouseNames && member.spouseNames.length > 5) {
      warnings.push({
        row: rowNumber,
        field: "spouseNames",
        message:
          "Member has many spouses listed, please verify this is correct",
      });
    }

    // Validate family role
    if (
      member.familyRole &&
      !["ADMIN", "MEMBER", "HEAD", "VIEWER"].includes(
        member.familyRole.toUpperCase()
      )
    ) {
      errors.push({
        row: rowNumber,
        field: "familyRole",
        message: `Invalid family role: ${member.familyRole}. Must be one of: ADMIN, MEMBER, HEAD, VIEWER`,
      });
      isValid = false;
    }

    // Check for duplicate names in the same import batch
    if (member.name) {
      const duplicateCount = validData.filter(
        (m) => m.name.toLowerCase() === member.name.toLowerCase()
      ).length;

      if (duplicateCount > 0) {
        warnings.push({
          row: rowNumber,
          field: "name",
          message: `Duplicate member name found: ${member.name}. This may cause confusion.`,
        });
      }
    }

    // If member is valid, add to valid data
    if (isValid) {
      validData.push(member);
    }
  }

  private validatePersonalInfo(
    personalInfo: any,
    rowNumber: number,
    errors: ImportError[],
    warnings: ImportWarning[]
  ): void {
    // Validate bio
    if (personalInfo.bio && personalInfo.bio.length > 1000) {
      errors.push({
        row: rowNumber,
        field: "bio",
        message: "Biography must be less than 1000 characters",
      });
    }

    // Validate birth date
    if (personalInfo.birthDate) {
      if (!this.isValidDate(personalInfo.birthDate)) {
        errors.push({
          row: rowNumber,
          field: "birthDate",
          message:
            "Birth date must be a valid date (YYYY-MM-DD format recommended)",
        });
      } else {
        const birthDate = new Date(personalInfo.birthDate);
        const now = new Date();
        const age = now.getFullYear() - birthDate.getFullYear();

        if (age > 150) {
          warnings.push({
            row: rowNumber,
            field: "birthDate",
            message: "Birth date seems unusually old, please verify",
          });
        } else if (age < 0) {
          errors.push({
            row: rowNumber,
            field: "birthDate",
            message: "Birth date cannot be in the future",
          });
        }
      }
    }

    // Validate birth place
    if (personalInfo.birthPlace && personalInfo.birthPlace.length > 100) {
      warnings.push({
        row: rowNumber,
        field: "birthPlace",
        message: "Birth place is quite long, consider shortening it",
      });
    }

    // Validate occupation
    if (personalInfo.occupation && personalInfo.occupation.length > 100) {
      warnings.push({
        row: rowNumber,
        field: "occupation",
        message: "Occupation is quite long, consider shortening it",
      });
    }

    // Validate social links
    if (personalInfo.socialLinks) {
      this.validateSocialLinks(
        personalInfo.socialLinks,
        rowNumber,
        errors,
        warnings
      );
    }
  }

  private validateSocialLinks(
    socialLinks: Record<string, string>,
    rowNumber: number,
    errors: ImportError[],
    warnings: ImportWarning[]
  ): void {
    const urlRegex = /^https?:\/\/.+/i;

    Object.entries(socialLinks).forEach(([platform, url]) => {
      if (typeof url !== "string") {
        errors.push({
          row: rowNumber,
          field: `socialLinks.${platform}`,
          message: `Social link for ${platform} must be a string`,
        });
        return;
      }

      if (url.length > 500) {
        errors.push({
          row: rowNumber,
          field: `socialLinks.${platform}`,
          message: `Social link for ${platform} is too long (max 500 characters)`,
        });
        return;
      }

      if (!urlRegex.test(url)) {
        warnings.push({
          row: rowNumber,
          field: `socialLinks.${platform}`,
          message: `Social link for ${platform} doesn't appear to be a valid URL`,
        });
      }
    });
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return (
      !isNaN(date.getTime()) &&
      date.toISOString().startsWith(dateString.substring(0, 10))
    );
  }

  validateRelationships(data: ImportMemberData[]): {
    errors: ImportError[];
    warnings: ImportWarning[];
  } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const memberNames = new Set(data.map((m) => m.name.toLowerCase()));

    data.forEach((member, index) => {
      const rowNumber = index + 1;

      // Check if parent names exist in the import
      if (member.parentNames) {
        member.parentNames.forEach((parentName) => {
          if (!memberNames.has(parentName.toLowerCase())) {
            warnings.push({
              row: rowNumber,
              field: "parentNames",
              message: `Parent "${parentName}" not found in import data. Relationship will be created but parent may not exist.`,
            });
          }
        });
      }

      // Check if spouse names exist in the import
      if (member.spouseNames) {
        member.spouseNames.forEach((spouseName) => {
          if (!memberNames.has(spouseName.toLowerCase())) {
            warnings.push({
              row: rowNumber,
              field: "spouseNames",
              message: `Spouse "${spouseName}" not found in import data. Relationship will be created but spouse may not exist.`,
            });
          }
        });
      }
    });

    return { errors, warnings };
  }

  sanitizeImportData(data: ImportMemberData[]): ImportMemberData[] {
    return data.map((member) => ({
      ...member,
      name: member.name?.trim(),
      color: member.color?.trim(),
      familyName: member.familyName?.trim(),
      familyRole: member.familyRole?.trim(),
      parentNames: member.parentNames
        ?.map((name) => name.trim())
        .filter((name) => name.length > 0),
      spouseNames: member.spouseNames
        ?.map((name) => name.trim())
        .filter((name) => name.length > 0),
      personalInfo: member.personalInfo
        ? {
            ...member.personalInfo,
            bio: member.personalInfo.bio?.trim(),
            birthPlace: member.personalInfo.birthPlace?.trim(),
            occupation: member.personalInfo.occupation?.trim(),
            socialLinks: member.personalInfo.socialLinks
              ? Object.fromEntries(
                  Object.entries(member.personalInfo.socialLinks)
                    .map(([key, value]) => [
                      key.trim(),
                      typeof value === "string" ? value.trim() : value,
                    ])
                    .filter(([key]) => key.length > 0)
                )
              : undefined,
          }
        : undefined,
    }));
  }
}
