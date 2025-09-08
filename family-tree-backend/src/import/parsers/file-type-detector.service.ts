import { Injectable } from "@nestjs/common";
import { FileTypeDetection } from "../interfaces/import.interface";

@Injectable()
export class FileTypeDetectorService {
  private readonly EXCEL_MIME_TYPES = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.ms-excel.template.macroEnabled.12",
    "application/vnd.ms-excel.addin.macroEnabled.12",
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
  ];

  private readonly EXCEL_EXTENSIONS = [
    ".xlsx",
    ".xls",
    ".xlsm",
    ".xltx",
    ".xltm",
    ".xlam",
    ".xlsb",
  ];
  private readonly JSON_EXTENSIONS = [".json"];

  detectFileType(file: Express.Multer.File): FileTypeDetection {
    const mimeType = file.mimetype.toLowerCase();
    const originalName = file.originalname.toLowerCase();
    const extension = this.getFileExtension(originalName);

    // Check for Excel files
    if (this.isExcelMimeType(mimeType) || this.isExcelExtension(extension)) {
      return {
        type: "excel",
        mimeType,
        extension,
        confidence: this.calculateConfidence(mimeType, extension, "excel"),
      };
    }

    // Check for JSON files
    if (mimeType === "application/json" || this.isJsonExtension(extension)) {
      return {
        type: "json",
        mimeType,
        extension,
        confidence: this.calculateConfidence(mimeType, extension, "json"),
      };
    }

    // Try to detect by content if possible
    if (file.buffer) {
      const contentType = this.detectByContent(file.buffer);
      if (contentType !== "unknown") {
        return {
          type: contentType as "excel" | "json",
          mimeType,
          extension,
          confidence: 0.7, // Lower confidence for content-based detection
        };
      }
    }

    return {
      type: "unknown",
      mimeType,
      extension,
      confidence: 0,
    };
  }

  private isExcelMimeType(mimeType: string): boolean {
    return this.EXCEL_MIME_TYPES.includes(mimeType);
  }

  private isExcelExtension(extension: string): boolean {
    return this.EXCEL_EXTENSIONS.includes(extension);
  }

  private isJsonExtension(extension: string): boolean {
    return this.JSON_EXTENSIONS.includes(extension);
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : "";
  }

  private calculateConfidence(
    mimeType: string,
    extension: string,
    expectedType: string
  ): number {
    let confidence = 0;

    if (expectedType === "excel") {
      if (this.isExcelMimeType(mimeType)) confidence += 0.6;
      if (this.isExcelExtension(extension)) confidence += 0.4;
    } else if (expectedType === "json") {
      if (mimeType === "application/json") confidence += 0.6;
      if (this.isJsonExtension(extension)) confidence += 0.4;
    }

    return Math.min(confidence, 1.0);
  }

  private detectByContent(buffer: Buffer): string {
    // Check for Excel file signatures
    if (buffer.length >= 4) {
      const signature = buffer.subarray(0, 4);

      // Excel 2007+ (ZIP-based)
      if (signature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
        return "excel";
      }

      // Older Excel formats
      if (
        signature.equals(
          Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
        ) ||
        signature.equals(
          Buffer.from([0x09, 0x08, 0x10, 0x00, 0x00, 0x06, 0x05, 0x00])
        )
      ) {
        return "excel";
      }
    }

    // Check for JSON content
    if (buffer.length > 0) {
      try {
        const content = buffer
          .toString("utf8", 0, Math.min(1000, buffer.length))
          .trim();
        if (
          (content.startsWith("{") && content.endsWith("}")) ||
          (content.startsWith("[") && content.endsWith("]"))
        ) {
          JSON.parse(content);
          return "json";
        }
      } catch {
        // Not valid JSON
      }
    }

    return "unknown";
  }

  validateFileSecurity(file: Express.Multer.File): {
    isValid: boolean;
    error?: string;
  } {
    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size exceeds maximum limit of 50MB",
      };
    }

    // Check for potentially dangerous file types
    const dangerousTypes = [
      "application/x-msdownload", // .exe
      "application/x-executable",
      "application/x-dosexec",
      "application/octet-stream",
    ];

    if (dangerousTypes.includes(file.mimetype.toLowerCase())) {
      return {
        isValid: false,
        error: "File type not allowed for security reasons",
      };
    }

    // Check filename for suspicious patterns
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /[<>:"|?*]/, // Invalid filename characters
      /^\./, // Hidden files
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(file.originalname))) {
      return { isValid: false, error: "Invalid filename" };
    }

    return { isValid: true };
  }
}
