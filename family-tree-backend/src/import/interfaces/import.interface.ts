import { Gender, MemberStatus } from "@prisma/client";

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  importId: string;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportWarning {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportMemberData {
  name: string;
  gender?: Gender;
  status?: MemberStatus;
  personalInfo?: {
    bio?: string;
    birthDate?: string;
    birthPlace?: string;
    occupation?: string;
    socialLinks?: Record<string, string>;
    [key: string]: any;
  };
  color?: string;
  parentNames?: string[];
  spouseNames?: string[];
  familyName?: string;
  familyRole?: string;
}

export interface ImportFamilyData {
  name: string;
  description?: string;
  members: ImportMemberData[];
}

export interface ImportBatch {
  id: string;
  data: ImportMemberData[] | ImportFamilyData[];
  fileType: "excel" | "json";
  fileName: string;
  uploadedBy: string;
  familyId?: string;
  createdAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  validData: ImportMemberData[];
}

export interface FileTypeDetection {
  type: "excel" | "json" | "unknown";
  mimeType: string;
  extension: string;
  confidence: number;
}

export interface ImportProgress {
  importId: string;
  status: "pending" | "processing" | "completed" | "failed" | "rolled_back";
  progress: number; // 0-100
  currentStep: string;
  totalRecords: number;
  processedRecords: number;
  errors: ImportError[];
  startTime: Date;
  endTime?: Date;
}
