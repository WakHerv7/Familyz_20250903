import { Injectable, Logger } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import {
  ImportMemberData,
  ImportError,
  ImportWarning,
} from "../interfaces/import.interface";
import { Gender, MemberStatus } from "@prisma/client";

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  async parseExcelFile(buffer: Buffer | Buffer<ArrayBufferLike>): Promise<{
    data: ImportMemberData[];
    errors: ImportError[];
    warnings: ImportWarning[];
  }> {
    const workbook = new ExcelJS.Workbook();

    try {
      // Convert buffer to ensure compatibility with ExcelJS
      const bufferData = Buffer.isBuffer(buffer)
        ? buffer
        : Buffer.from(buffer as any);
      await workbook.xlsx.load(bufferData as any);
    } catch (error) {
      this.logger.error("Failed to load Excel file", error);
      throw new Error("Invalid Excel file format");
    }

    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    if (!worksheet) {
      throw new Error("No worksheets found in Excel file");
    }

    return this.parseWorksheet(worksheet);
  }

  private parseWorksheet(worksheet: ExcelJS.Worksheet): {
    data: ImportMemberData[];
    errors: ImportError[];
    warnings: ImportWarning[];
  } {
    const data: ImportMemberData[] = [];
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Find header row (usually row 1)
    const headerRow = worksheet.getRow(1);
    const headers = this.extractHeaders(headerRow);

    if (headers.length === 0) {
      errors.push({
        row: 1,
        message: "No headers found in Excel file",
      });
      return { data, errors, warnings };
    }

    // Validate required headers
    const requiredHeaders = ["name"];
    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.some((h) => h.toLowerCase() === header.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      errors.push({
        row: 1,
        message: `Missing required headers: ${missingHeaders.join(", ")}`,
      });
      return { data, errors, warnings };
    }

    // Parse data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const rowData = this.parseRow(row, headers, rowNumber);
      if (rowData) {
        data.push(rowData);
      }
    });

    return { data, errors, warnings };
  }

  private extractHeaders(headerRow: ExcelJS.Row): string[] {
    const headers: string[] = [];

    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value?.toString().trim();
      if (value) {
        headers.push(value);
      }
    });

    return headers;
  }

  private parseRow(
    row: ExcelJS.Row,
    headers: string[],
    rowNumber: number
  ): ImportMemberData | null {
    const memberData: ImportMemberData = {
      name: "",
    };

    let hasData = false;

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (!header) return;

      const value = this.getCellValue(cell);
      if (value !== null && value !== undefined && value !== "") {
        hasData = true;
        this.mapHeaderToField(
          memberData,
          header.toLowerCase(),
          value,
          rowNumber
        );
      }
    });

    return hasData ? memberData : null;
  }

  private getCellValue(cell: ExcelJS.Cell): any {
    if (cell.value === null || cell.value === undefined) {
      return null;
    }

    // Handle different cell types
    if (typeof cell.value === "object") {
      if ("text" in cell.value) {
        return cell.value.text;
      }
      if ("result" in cell.value) {
        return cell.value.result;
      }
    }

    return cell.value;
  }

  private mapHeaderToField(
    memberData: ImportMemberData,
    header: string,
    value: any,
    rowNumber: number
  ): void {
    const stringValue = String(value).trim();

    switch (header) {
      case "name":
      case "full_name":
      case "fullname":
        memberData.name = stringValue;
        break;

      case "gender":
      case "sex":
        memberData.gender = this.parseGender(stringValue);
        break;

      case "status":
        memberData.status = this.parseStatus(stringValue);
        break;

      case "color":
      case "member_color":
        memberData.color = stringValue;
        break;

      case "bio":
      case "biography":
        if (!memberData.personalInfo) memberData.personalInfo = {};
        memberData.personalInfo.bio = stringValue;
        break;

      case "birth_date":
      case "birthdate":
      case "date_of_birth":
      case "dob":
        if (!memberData.personalInfo) memberData.personalInfo = {};
        memberData.personalInfo.birthDate = stringValue;
        break;

      case "birth_place":
      case "birthplace":
      case "place_of_birth":
        if (!memberData.personalInfo) memberData.personalInfo = {};
        memberData.personalInfo.birthPlace = stringValue;
        break;

      case "occupation":
      case "job":
      case "profession":
        if (!memberData.personalInfo) memberData.personalInfo = {};
        memberData.personalInfo.occupation = stringValue;
        break;

      case "parent_names":
      case "parents":
        memberData.parentNames = this.parseNameList(stringValue);
        break;

      case "spouse_names":
      case "spouses":
        memberData.spouseNames = this.parseNameList(stringValue);
        break;

      case "family_name":
      case "family":
        memberData.familyName = stringValue;
        break;

      case "family_role":
      case "role":
        memberData.familyRole = stringValue;
        break;

      default:
        // Handle social links (facebook, twitter, etc.)
        if (
          header.includes("social") ||
          header.includes("link") ||
          ["facebook", "twitter", "instagram", "linkedin", "website"].includes(
            header
          )
        ) {
          if (!memberData.personalInfo) memberData.personalInfo = {};
          if (!memberData.personalInfo.socialLinks)
            memberData.personalInfo.socialLinks = {};
          memberData.personalInfo.socialLinks[header] = stringValue;
        }
        break;
    }
  }

  private parseGender(value: string): Gender | undefined {
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

  async validateExcelStructure(
    buffer: Buffer | Buffer<ArrayBufferLike>
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const workbook = new ExcelJS.Workbook();
      // Convert buffer to ensure compatibility with ExcelJS
      const bufferData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      await workbook.xlsx.load(bufferData as any);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        errors.push("No worksheets found in the Excel file");
        return { isValid: false, errors, warnings };
      }

      // Check if worksheet has data
      const rowCount = worksheet.rowCount;
      if (rowCount < 2) {
        errors.push(
          "Excel file must contain at least a header row and one data row"
        );
        return { isValid: false, errors, warnings };
      }

      // Check header row
      const headerRow = worksheet.getRow(1);
      const headers = this.extractHeaders(headerRow);

      if (headers.length === 0) {
        errors.push("No column headers found in the first row");
        return { isValid: false, errors, warnings };
      }

      // Check for required columns
      const hasNameColumn = headers.some((h) =>
        ["name", "full_name", "fullname"].includes(h.toLowerCase())
      );

      if (!hasNameColumn) {
        errors.push('Excel file must contain a "name" column');
        return { isValid: false, errors, warnings };
      }

      // Check for data rows
      let dataRowCount = 0;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const hasData = Array.from(row.values as any[]).some(
            (cell) =>
              cell !== null && cell !== undefined && String(cell).trim() !== ""
          );
          if (hasData) dataRowCount++;
        }
      });

      if (dataRowCount === 0) {
        warnings.push("No data rows found in the Excel file");
      }
    } catch (error) {
      errors.push(`Failed to validate Excel file: ${error.message}`);
      return { isValid: false, errors, warnings };
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}
