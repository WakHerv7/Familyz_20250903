import * as ExcelJS from "exceljs";
import { Response } from "express";
export declare class TemplateService {
    generateExcelTemplate(includeSampleData?: boolean, size?: "small" | "medium" | "large"): Promise<ExcelJS.Workbook>;
    generateJsonTemplate(includeSampleData?: boolean, size?: "small" | "medium" | "large"): Promise<string>;
    private getSampleData;
    private getJsonSampleData;
    sendExcelTemplate(response: Response, includeSampleData?: boolean, size?: "small" | "medium" | "large"): Promise<void>;
    sendJsonTemplate(response: Response, includeSampleData?: boolean, size?: "small" | "medium" | "large"): Promise<void>;
}
