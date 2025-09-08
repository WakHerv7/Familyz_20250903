import { Injectable, Logger } from "@nestjs/common";
import {
  ImportMemberData,
  ImportFamilyData,
  ImportError,
  ImportWarning,
} from "../interfaces/import.interface";
import { Gender, MemberStatus } from "@prisma/client";

@Injectable()
export class JsonParserService {
  private readonly logger = new Logger(JsonParserService.name);

  async parseJsonFile(buffer: Buffer): Promise<{
    data: ImportMemberData[] | ImportFamilyData[];
    errors: ImportError[];
    warnings: ImportWarning[];
  }> {
    try {
      const content = buffer.toString("utf8");
      const jsonData = JSON.parse(content);

      return this.parseJsonData(jsonData);
    } catch (error) {
      this.logger.error("Failed to parse JSON file", error);
      throw new Error("Invalid JSON file format");
    }
  }

  private parseJsonData(jsonData: any): {
    data: ImportMemberData[] | ImportFamilyData[];
    errors: ImportError[];
    warnings: ImportWarning[];
  } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Check if it's an array of members or a family object
    if (Array.isArray(jsonData)) {
      // Array of members
      const members: ImportMemberData[] = [];
      jsonData.forEach((item, index) => {
        try {
          const member = this.parseMemberObject(item, index + 1);
          if (member) {
            members.push(member);
          }
        } catch (error) {
          errors.push({
            row: index + 1,
            message: `Failed to parse member at index ${index}: ${error.message}`,
            data: item,
          });
        }
      });
      return { data: members, errors, warnings };
    } else if (jsonData.members) {
      // Family object with members array
      try {
        const family = this.parseFamilyObject(jsonData);
        return { data: [family], errors, warnings };
      } catch (error) {
        errors.push({
          row: 1,
          message: `Failed to parse family object: ${error.message}`,
          data: jsonData,
        });
        return { data: [], errors, warnings };
      }
    } else {
      // Single member object
      try {
        const member = this.parseMemberObject(jsonData, 1);
        return { data: member ? [member] : [], errors, warnings };
      } catch (error) {
        errors.push({
          row: 1,
          message: `Failed to parse member object: ${error.message}`,
          data: jsonData,
        });
        return { data: [], errors, warnings };
      }
    }
  }

  private parseFamilyObject(familyData: any): ImportFamilyData {
    const family: ImportFamilyData = {
      name: familyData.name || "Imported Family",
      description: familyData.description,
      members: [],
    };

    if (Array.isArray(familyData.members)) {
      family.members = familyData.members
        .map((memberData: any, index: number) => {
          try {
            return this.parseMemberObject(memberData, index + 1);
          } catch (error) {
            // Member parsing errors will be handled at a higher level
            return null;
          }
        })
        .filter(
          (member: ImportMemberData | null) => member !== null
        ) as ImportMemberData[];
    }

    return family;
  }

  private parseMemberObject(
    memberData: any,
    rowNumber: number
  ): ImportMemberData | null {
    if (!memberData || typeof memberData !== "object") {
      return null;
    }

    const member: ImportMemberData = {
      name:
        memberData.name || memberData.fullName || memberData.full_name || "",
    };

    // Parse basic fields
    if (memberData.gender) {
      member.gender = this.parseGender(memberData.gender);
    }

    if (memberData.status) {
      member.status = this.parseStatus(memberData.status);
    }

    if (memberData.color) {
      member.color = memberData.color;
    }

    // Parse personal info
    if (
      memberData.bio ||
      memberData.birthDate ||
      memberData.birthPlace ||
      memberData.occupation ||
      memberData.socialLinks
    ) {
      member.personalInfo = {};

      if (memberData.bio) member.personalInfo.bio = memberData.bio;
      if (memberData.birthDate || memberData.birth_date || memberData.dob) {
        member.personalInfo.birthDate =
          memberData.birthDate || memberData.birth_date || memberData.dob;
      }
      if (memberData.birthPlace || memberData.birth_place) {
        member.personalInfo.birthPlace =
          memberData.birthPlace || memberData.birth_place;
      }
      if (memberData.occupation || memberData.job || memberData.profession) {
        member.personalInfo.occupation =
          memberData.occupation || memberData.job || memberData.profession;
      }
      if (memberData.socialLinks || memberData.social_links) {
        member.personalInfo.socialLinks =
          memberData.socialLinks || memberData.social_links;
      }
    }

    // Parse relationships
    if (
      memberData.parentNames ||
      memberData.parents ||
      memberData.parent_names
    ) {
      const parents =
        memberData.parentNames || memberData.parents || memberData.parent_names;
      member.parentNames = Array.isArray(parents)
        ? parents
        : this.parseNameList(String(parents));
    }

    if (
      memberData.spouseNames ||
      memberData.spouses ||
      memberData.spouse_names
    ) {
      const spouses =
        memberData.spouseNames || memberData.spouses || memberData.spouse_names;
      member.spouseNames = Array.isArray(spouses)
        ? spouses
        : this.parseNameList(String(spouses));
    }

    // Parse family info
    if (memberData.familyName || memberData.family) {
      member.familyName = memberData.familyName || memberData.family;
    }

    if (memberData.familyRole || memberData.role) {
      member.familyRole = memberData.familyRole || memberData.role;
    }

    return member;
  }

  private parseGender(value: string): Gender | undefined {
    if (typeof value !== "string") return undefined;

    const lowerValue = value.toLowerCase();

    if (["male", "m", "man", "boy"].includes(lowerValue)) {
      return Gender.MALE;
    }
    if (["female", "f", "woman", "girl"].includes(lowerValue)) {
      return Gender.FEMALE;
    }
    if (["other", "non-binary", "prefer not to say"].includes(lowerValue)) {
      return Gender.OTHER;
    }

    return undefined;
  }

  private parseStatus(value: string): MemberStatus | undefined {
    if (typeof value !== "string") return undefined;

    const lowerValue = value.toLowerCase();

    if (["active", "living", "alive"].includes(lowerValue)) {
      return MemberStatus.ACTIVE;
    }
    if (["inactive", "deceased", "dead"].includes(lowerValue)) {
      return MemberStatus.DECEASED;
    }
    if (["archived"].includes(lowerValue)) {
      return MemberStatus.ARCHIVED;
    }

    return undefined;
  }

  private parseNameList(value: string): string[] {
    return value
      .split(/[;,]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  async validateJsonStructure(buffer: Buffer): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const content = buffer.toString("utf8");
      const jsonData = JSON.parse(content);

      // Check if it's a valid structure
      if (Array.isArray(jsonData)) {
        // Array of members
        if (jsonData.length === 0) {
          warnings.push("JSON array is empty");
        } else {
          // Validate first few members
          const sampleSize = Math.min(5, jsonData.length);
          for (let i = 0; i < sampleSize; i++) {
            if (!jsonData[i] || typeof jsonData[i] !== "object") {
              errors.push(`Invalid member object at index ${i}`);
            } else if (
              !jsonData[i].name &&
              !jsonData[i].fullName &&
              !jsonData[i].full_name
            ) {
              errors.push(`Member at index ${i} is missing a name field`);
            }
          }
        }
      } else if (jsonData.members) {
        // Family object
        if (!jsonData.name) {
          warnings.push("Family object is missing a name field");
        }
        if (!Array.isArray(jsonData.members)) {
          errors.push("Family members field must be an array");
        } else if (jsonData.members.length === 0) {
          warnings.push("Family has no members");
        }
      } else {
        // Single member object
        if (!jsonData.name && !jsonData.fullName && !jsonData.full_name) {
          errors.push("Member object is missing a name field");
        }
      }
    } catch (error) {
      errors.push(`Failed to validate JSON file: ${error.message}`);
      return { isValid: false, errors, warnings };
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  generateJsonTemplate(): string {
    const template = {
      name: "Family Name (optional)",
      description: "Family description (optional)",
      members: [
        {
          name: "John Doe",
          gender: "MALE", // MALE, FEMALE, or OTHER
          status: "ACTIVE", // ACTIVE, INACTIVE, DECEASED, or ARCHIVED
          color: "#FF5733", // Hex color code
          personalInfo: {
            bio: "Brief biography",
            birthDate: "1990-01-15",
            birthPlace: "City, Country",
            occupation: "Software Engineer",
            socialLinks: {
              facebook: "https://facebook.com/johndoe",
              linkedin: "https://linkedin.com/in/johndoe",
            },
          },
          parentNames: ["Father Name", "Mother Name"],
          spouseNames: ["Spouse Name"],
          familyName: "Family Name",
          familyRole: "MEMBER", // ADMIN, MEMBER, HEAD, or VIEWER
        },
      ],
    };

    return JSON.stringify(template, null, 2);
  }
}
