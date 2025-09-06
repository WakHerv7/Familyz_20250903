# Family Tree Download Workflow - Complete Technical Guide

## Overview

This document provides a comprehensive technical explanation of the download workflow in the Family Tree application, from the initial button click to the final file download.

## Table of Contents

1. [Frontend User Interaction](#frontend-user-interaction)
2. [React Hook Execution](#react-hook-execution)
3. [API Request Flow](#api-request-flow)
4. [Backend Processing](#backend-processing)
5. [File Generation](#file-generation)
6. [Download Initiation](#download-initiation)
7. [Browser Download Handling](#browser-download-handling)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)

## Frontend User Interaction

### 1. Export Button Click

```typescript
// ExportManager.tsx - handleExport function
const handleExport = async () => {
  // Validation checks
  if (!folderTreeData) {
    toast.error("No data available for export");
    return;
  }

  // Create export request object
  const exportRequest: ExportRequest = {
    format: exportOptions.format, // "pdf" | "excel"
    scope: exportOptions.scope, // "current-family" | "all-families" | "selected-families"
    familyIds: exportOptions.familyIds, // Selected family IDs
    config: exportOptions.config, // Export configuration
    includeData: exportOptions.includeData, // Data inclusion options
  };

  // Execute export mutation
  await exportFamilyData.mutateAsync(exportRequest);
};
```

### 2. Export Request Structure

```typescript
interface ExportRequest {
  format: "pdf" | "excel";
  scope: "current-family" | "all-families" | "selected-families";
  familyIds?: string[];
  config: {
    formats: ("pdf" | "excel")[];
    familyTree: {
      structure: "folderTree" | "traditional" | "interactive" | "textTree";
      includeMembersList: boolean;
      memberDetails: string[];
    };
  };
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}
```

## React Hook Execution

### 1. useExportFamilyData Hook

```typescript
// api.ts - useExportFamilyData hook
export const useExportFamilyData = () => {
  return useMutation({
    mutationFn: async (exportRequest: ExportRequest) => {
      // Make API call to backend
      const response = await apiClient.post<{
        downloadUrl: string;
        filename: string;
      }>("/export/family-data", exportRequest);
      return response;
    },
    onSuccess: async (result, variables) => {
      // Handle successful response
      if (result && result.downloadUrl) {
        await initiateDownload(result, variables);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export family data");
    },
  });
};
```

### 2. Download Initiation Function

```typescript
const initiateDownload = async (result, variables) => {
  // Construct full download URL
  const fullUrl = result.downloadUrl.startsWith("http")
    ? result.downloadUrl
    : `${window.location.origin}${result.downloadUrl}`;

  console.log("Download URL:", fullUrl);

  try {
    // Primary download method: Direct link approach
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = result.filename || `family-tree.${variables.format}`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${variables.format.toUpperCase()} exported successfully!`);
  } catch (error) {
    console.error("Direct download failed, trying fetch approach:", error);

    // Fallback method: Fetch with blob
    await downloadWithFetch(fullUrl, result.filename, variables.format);
  }
};
```

## API Request Flow

### 1. HTTP Request Details

```typescript
// Frontend API call
const response = await apiClient.post<{
  downloadUrl: string;
  filename: string;
}>("/export/family-data", exportRequest);

// This becomes:
POST /export/family-data
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "format": "pdf",
  "scope": "current-family",
  "config": { ... },
  "includeData": { ... }
}
```

### 2. Backend Route Handler

```typescript
// export.controller.ts
@Post("family-data")
async exportFamilyData(
  @Body() exportRequest: ExportRequest,
  @Request() req: AuthenticatedRequest
): Promise<{ downloadUrl: string; filename: string }> {
  // Validate request
  if (!exportRequest.format || !exportRequest.scope) {
    throw new BadRequestException("Format and scope are required");
  }

  try {
    // Call service method
    const result = await this.exportService.exportFamilyData(
      req.user.memberId,
      exportRequest
    );

    return result;
  } catch (error) {
    console.error("Export failed:", error);
    throw new BadRequestException("Export failed: " + error.message);
  }
}
```

## Backend Processing

### 1. Service Method Execution

```typescript
// export.service.ts - exportFamilyData method
async exportFamilyData(
  memberId: string,
  exportRequest: ExportRequest
): Promise<{ downloadUrl: string; filename: string }> {
  // Step 1: Get folder tree data
  const folderTreeData = await this.getFolderTreeData(memberId);

  // Step 2: Filter families based on scope
  let familiesToExport = folderTreeData.families;
  if (exportRequest.scope === "current-family") {
    const currentFamilyId = currentMember.familyMemberships?.[0]?.familyId;
    familiesToExport = folderTreeData.families.filter(
      (f) => f.id === currentFamilyId
    );
  }

  // Step 3: Generate export based on format
  if (exportRequest.format === "pdf") {
    return this.generatePDF(familiesToExport, exportRequest);
  } else if (exportRequest.format === "excel") {
    return this.generateExcel(familiesToExport, exportRequest);
  }
}
```

### 2. Data Retrieval Process

```typescript
// getFolderTreeData method
async getFolderTreeData(memberId: string): Promise<FolderTreeExportData> {
  // 1. Get member with family memberships
  const member = await this.prisma.member.findUnique({
    where: { id: memberId },
    include: { familyMemberships: { include: { family: true } } }
  });

  // 2. Check admin permissions
  const isAdmin = member.familyMemberships.some(
    (membership) => membership.role === "ADMIN" || membership.role === "HEAD"
  );

  // 3. Query families based on permissions
  let families;
  if (isAdmin) {
    families = await this.prisma.family.findMany({
      include: { memberships: { include: { member: { ... } } } }
    });
  } else {
    // Regular user - only their families
    const familyIds = member.familyMemberships.map((m) => m.familyId);
    families = await this.prisma.family.findMany({
      where: { id: { in: familyIds } },
      include: { memberships: { include: { member: { ... } } } }
    });
  }

  // 4. Process and transform data
  // Calculate generations, normalize relationships, etc.
}
```

## File Generation

### 1. PDF Generation Process

```typescript
private async generatePDF(
  families: any[],
  exportRequest: ExportRequest
): Promise<{ downloadUrl: string; filename: string }> {
  // 1. Launch Puppeteer browser
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-web-security"]
  });

  // 2. Create new page
  const page = await browser.newPage();

  // 3. Generate HTML content
  let htmlContent = this.buildHTMLContent(families, exportRequest);

  // 4. Set HTML content in page
  await page.setContent(htmlContent, {
    waitUntil: ["load", "domcontentloaded", "networkidle0", "networkidle2"]
  });

  // 5. Wait for fonts and resources
  await page.waitForFunction("document.fonts.ready");

  // 6. Generate PDF buffer
  const pdfBuffer = await page.pdf({
    format: "A4",
    landscape: true,
    margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    printBackground: true,
    displayHeaderFooter: false
  });

  // 7. Save PDF to file system
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `family-tree-${exportRequest.config.familyTree.structure}-${timestamp}.pdf`;
  const filePath = path.join(__dirname, "..", "..", "public", "exports", filename);

  fs.writeFileSync(filePath, pdfBuffer);

  // 8. Close browser
  await browser.close();

  // 9. Return download URL
  return {
    downloadUrl: `/export/download/${filename}`,
    filename
  };
}
```

### 2. Excel Generation Process

```typescript
private async generateExcel(
  families: any[],
  exportRequest: ExportRequest
): Promise<{ downloadUrl: string; filename: string }> {
  // 1. Create workbook
  const workbook = new ExcelJS.Workbook();

  // 2. Add worksheets
  const treeSheet = workbook.addWorksheet("Family Tree");
  const membersSheet = workbook.addWorksheet("Members List");

  // 3. Generate tree data
  const treeData = this.generateExcelTreeFormat(families.flatMap(f => f.members), exportRequest);

  // 4. Populate worksheets
  this.populateTreeSheet(treeSheet, treeData);
  this.populateMembersSheet(membersSheet, families, exportRequest);

  // 5. Save workbook
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `family-tree-excel-${timestamp}.xlsx`;
  const filePath = path.join(__dirname, "..", "..", "public", "exports", filename);

  await workbook.xlsx.writeFile(filePath);

  return {
    downloadUrl: `/export/download/${filename}`,
    filename
  };
}
```

## Download Initiation

### 1. Primary Download Method (Direct Link)

```typescript
// Create invisible download link
const link = document.createElement("a");
link.href = fullUrl; // e.g., "/export/download/family-tree-2025-09-06.pdf"
link.download = result.filename || `family-tree.${variables.format}`;
link.style.display = "none";

// Add to DOM, click, and remove
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

### 2. Fallback Download Method (Fetch with Blob)

```typescript
const downloadWithFetch = async (fullUrl, filename, format) => {
  // Get authentication token
  const token = localStorage.getItem("accessToken");

  // Fetch file with authorization
  const response = await fetch(fullUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Convert to blob
  const blob = await response.blob();

  // Create blob URL
  const blobUrl = window.URL.createObjectURL(blob);

  // Create and trigger download
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || `family-tree.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up blob URL after delay
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
};
```

## Browser Download Handling

### 1. Direct Link Download

- Browser receives `<a>` element click
- Checks `href` attribute for download URL
- Initiates HTTP GET request to download endpoint
- Browser's download manager handles the file
- File is saved to user's default download directory

### 2. Blob Download Process

- JavaScript creates blob from response data
- Browser creates temporary blob URL
- `<a>` element triggers download of blob URL
- Browser saves blob content as file
- Blob URL is revoked after download

### 3. Download Endpoint Handler

```typescript
// export.controller.ts - downloadFile method
@Get("download/:filename")
async downloadFile(
  @Param("filename") filename: string,
  @Res() res: Response
): Promise<void> {
  // 1. Construct file path
  const filePath = path.join(__dirname, "..", "..", "public", "exports", filename);

  // 2. Check file existence
  if (!require("fs").existsSync(filePath)) {
    throw new BadRequestException("File not found");
  }

  // 3. Set appropriate content type
  const ext = filename.split(".").pop()?.toLowerCase();
  let contentType = "application/octet-stream";

  if (ext === "pdf") {
    contentType = "application/pdf";
  } else if (ext === "xlsx" || ext === "xls") {
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  // 4. Set response headers
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  // 5. Stream file to response
  const fileStream = require("fs").createReadStream(filePath);
  fileStream.pipe(res);
}
```

## Error Handling

### 1. Frontend Error Handling

```typescript
// Hook error handling
onError: (error: Error) => {
  console.error("Export failed:", error);
  toast.error(error.message || "Failed to export family data");
};

// Download error handling
try {
  // Primary download method
} catch (error) {
  console.error("Direct download failed, trying fetch approach:", error);
  try {
    // Fallback download method
  } catch (fallbackError) {
    console.error("Fallback download also failed:", fallbackError);
    toast.error("Download failed. Please try again.");
  }
}
```

### 2. Backend Error Handling

```typescript
try {
  const result = await this.exportService.exportFamilyData(
    req.user.memberId,
    exportRequest
  );
  return result;
} catch (error) {
  console.error("Export failed:", error);
  throw new BadRequestException("Export failed: " + error.message);
}
```

### 3. File System Error Handling

```typescript
// Check file existence before streaming
if (!require("fs").existsSync(filePath)) {
  throw new BadRequestException("File not found");
}

// Handle file read errors
const fileStream = require("fs").createReadStream(filePath);
fileStream.on("error", (error) => {
  console.error("File read error:", error);
  throw new BadRequestException("File read failed");
});
```

## Security Considerations

### 1. Authentication & Authorization

```typescript
// JWT token validation
@UseGuards(JwtAuthGuard)

// User permission checks
const isAdmin = member.familyMemberships.some(
  (membership) => membership.role === "ADMIN" || membership.role === "HEAD"
);

// File access validation
if (!require("fs").existsSync(filePath)) {
  throw new BadRequestException("File not found");
}
```

### 2. File Path Security

```typescript
// Prevent directory traversal attacks
const filename = path.basename(requestedFilename);
const filePath = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "exports",
  filename
);

// Validate file extension
const allowedExtensions = [".pdf", ".xlsx", ".xls"];
const ext = path.extname(filename).toLowerCase();
if (!allowedExtensions.includes(ext)) {
  throw new BadRequestException("Invalid file type");
}
```

### 3. CORS and Headers

```typescript
// Set appropriate CORS headers
res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

// Prevent MIME type sniffing
res.setHeader("X-Content-Type-Options", "nosniff");
```

## Performance Considerations

### 1. File Size Limits

- PDF generation may be memory-intensive for large family trees
- Excel files can become large with many members
- Consider implementing file size limits

### 2. Caching Strategy

```typescript
// Cache export data for 10 minutes
staleTime: 1000 * 60 * 10;

// Cache control headers
res.setHeader("Cache-Control", "private, max-age=300"); // 5 minutes
```

### 3. Cleanup Strategy

```typescript
// Clean up old export files periodically
// Implement file retention policy
// Remove temporary files after download
```

## Monitoring and Logging

### 1. Export Metrics

```typescript
// Log export events
console.log(
  `Export started: ${exportRequest.format} for user ${req.user.memberId}`
);

// Track export duration
const startTime = Date.now();
// ... export process ...
const duration = Date.now() - startTime;
console.log(`Export completed in ${duration}ms`);
```

### 2. Error Tracking

```typescript
// Log detailed error information
console.error("Export failed:", {
  userId: req.user.memberId,
  format: exportRequest.format,
  scope: exportRequest.scope,
  error: error.message,
  stack: error.stack,
});
```

## Conclusion

The download workflow in the Family Tree application is a comprehensive process that involves:

1. **Frontend**: User interaction, form validation, API calls
2. **Backend**: Data processing, file generation, security validation
3. **File System**: File creation, storage, streaming
4. **Browser**: Download initiation, file handling
5. **Error Handling**: Comprehensive error management at each step
6. **Security**: Authentication, authorization, file validation

This workflow ensures a robust, secure, and user-friendly export experience while maintaining data integrity and system performance.
