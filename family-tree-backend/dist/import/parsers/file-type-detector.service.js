"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTypeDetectorService = void 0;
const common_1 = require("@nestjs/common");
let FileTypeDetectorService = class FileTypeDetectorService {
    constructor() {
        this.EXCEL_MIME_TYPES = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.ms-excel.template.macroEnabled.12",
            "application/vnd.ms-excel.addin.macroEnabled.12",
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
        ];
        this.EXCEL_EXTENSIONS = [
            ".xlsx",
            ".xls",
            ".xlsm",
            ".xltx",
            ".xltm",
            ".xlam",
            ".xlsb",
        ];
        this.JSON_EXTENSIONS = [".json"];
    }
    detectFileType(file) {
        const mimeType = file.mimetype.toLowerCase();
        const originalName = file.originalname.toLowerCase();
        const extension = this.getFileExtension(originalName);
        if (this.isExcelMimeType(mimeType) || this.isExcelExtension(extension)) {
            return {
                type: "excel",
                mimeType,
                extension,
                confidence: this.calculateConfidence(mimeType, extension, "excel"),
            };
        }
        if (mimeType === "application/json" || this.isJsonExtension(extension)) {
            return {
                type: "json",
                mimeType,
                extension,
                confidence: this.calculateConfidence(mimeType, extension, "json"),
            };
        }
        if (file.buffer) {
            const contentType = this.detectByContent(file.buffer);
            if (contentType !== "unknown") {
                return {
                    type: contentType,
                    mimeType,
                    extension,
                    confidence: 0.7,
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
    isExcelMimeType(mimeType) {
        return this.EXCEL_MIME_TYPES.includes(mimeType);
    }
    isExcelExtension(extension) {
        return this.EXCEL_EXTENSIONS.includes(extension);
    }
    isJsonExtension(extension) {
        return this.JSON_EXTENSIONS.includes(extension);
    }
    getFileExtension(filename) {
        const lastDotIndex = filename.lastIndexOf(".");
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : "";
    }
    calculateConfidence(mimeType, extension, expectedType) {
        let confidence = 0;
        if (expectedType === "excel") {
            if (this.isExcelMimeType(mimeType))
                confidence += 0.6;
            if (this.isExcelExtension(extension))
                confidence += 0.4;
        }
        else if (expectedType === "json") {
            if (mimeType === "application/json")
                confidence += 0.6;
            if (this.isJsonExtension(extension))
                confidence += 0.4;
        }
        return Math.min(confidence, 1.0);
    }
    detectByContent(buffer) {
        if (buffer.length >= 4) {
            const signature = buffer.subarray(0, 4);
            if (signature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
                return "excel";
            }
            if (signature.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) ||
                signature.equals(Buffer.from([0x09, 0x08, 0x10, 0x00, 0x00, 0x06, 0x05, 0x00]))) {
                return "excel";
            }
        }
        if (buffer.length > 0) {
            try {
                const content = buffer
                    .toString("utf8", 0, Math.min(1000, buffer.length))
                    .trim();
                if ((content.startsWith("{") && content.endsWith("}")) ||
                    (content.startsWith("[") && content.endsWith("]"))) {
                    JSON.parse(content);
                    return "json";
                }
            }
            catch {
            }
        }
        return "unknown";
    }
    validateFileSecurity(file) {
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: "File size exceeds maximum limit of 50MB",
            };
        }
        const dangerousTypes = [
            "application/x-msdownload",
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
        const suspiciousPatterns = [
            /\.\./,
            /[<>:"|?*]/,
            /^\./,
        ];
        if (suspiciousPatterns.some((pattern) => pattern.test(file.originalname))) {
            return { isValid: false, error: "Invalid filename" };
        }
        return { isValid: true };
    }
};
exports.FileTypeDetectorService = FileTypeDetectorService;
exports.FileTypeDetectorService = FileTypeDetectorService = __decorate([
    (0, common_1.Injectable)()
], FileTypeDetectorService);
//# sourceMappingURL=file-type-detector.service.js.map