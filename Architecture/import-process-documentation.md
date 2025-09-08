# Import Process Documentation

## Complete File Import Process Flow

### Phase 1: Frontend File Selection & Initial Validation

**1. File Selection in ImportManager.tsx:**

```typescript
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setSelectedFile(file);
    setValidationResult(null);
    setImportProgress(null);
    setImportId(null);
  }
};
```

**2. Frontend File Validation:**

```typescript
const validateFile = async () => {
  const formData = new FormData();
  formData.append("file", selectedFile);
  if (familyId) {
    formData.append("familyId", familyId);
  }

  const response = await fetch("/api/import/validate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: formData,
  });
};
```

### Phase 2: Backend File Reception & Type Detection

**1. Controller Receives File (import.controller.ts):**

```typescript
@Post("validate")
@UseInterceptors(FileInterceptor("file"))
async validateFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() body: ValidateImportDto
) {
  const result = await this.importService.validateFile(file);
  return result;
}
```

**2. File Type Detection (file-type-detector.service.ts):**

```typescript
detectFileType(file: Express.Multer.File): FileTypeDetection {
  const mimeType = file.mimetype.toLowerCase();
  const extension = this.getFileExtension(file.originalname);

  // Check Excel files
  if (this.isExcelMimeType(mimeType) || this.isExcelExtension(extension)) {
    return { type: "excel", mimeType, extension, confidence: 0.9 };
  }

  // Check JSON files
  if (mimeType === "application/json") {
    return { type: "json", mimeType, extension, confidence: 0.9 };
  }
}
```

### Phase 3: File Parsing & Data Extraction

**1. Excel File Parsing (excel-parser.service.ts):**

```typescript
async parseExcelFile(buffer: Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  const headers = this.extractHeaders(headerRow);

  // Parse each data row
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const rowData = this.parseRow(row, headers, rowNumber);
    if (rowData) {
      data.push(rowData);
    }
  });
}
```

**2. JSON File Parsing (json-parser.service.ts):**

```typescript
async parseJsonFile(buffer: Buffer): Promise<ParseResult> {
  const content = buffer.toString("utf8");
  const jsonData = JSON.parse(content);

  if (Array.isArray(jsonData)) {
    // Array of members
    jsonData.forEach((item, index) => {
      const member = this.parseMemberObject(item, index + 1);
      if (member) members.push(member);
    });
  }
}
```

### Phase 4: Data Validation & Sanitization

**1. Comprehensive Validation (data-validator.service.ts):**

```typescript
validateImportData(data: ImportMemberData[]): ValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const validData: ImportMemberData[] = [];

  data.forEach((member, index) => {
    // Required field validation
    if (!member.name || member.name.trim().length === 0) {
      errors.push({
        row: index + 1,
        field: "name",
        message: "Member name is required",
      });
    }

    // Data type validation
    if (member.color && !this.isValidHexColor(member.color)) {
      errors.push({
        row: index + 1,
        field: "color",
        message: "Color must be a valid hex color code",
      });
    }
  });
}
```

**2. Data Sanitization:**

```typescript
sanitizeImportData(data: ImportMemberData[]): ImportMemberData[] {
  return data.map((member) => ({
    ...member,
    name: member.name?.trim(),
    color: member.color?.trim(),
    parentNames: member.parentNames
      ?.map((name) => name.trim())
      .filter((name) => name.length > 0),
  }));
}
```

### Phase 5: Database Import with Transaction

**1. Start Import Process (import.service.ts):**

```typescript
async startImport(
  file: Express.Multer.File,
  userId: string,
  familyId?: string
): Promise<string> {
  const importId = uuidv4();

  // Initialize progress tracking
  const progress: ImportProgress = {
    importId,
    status: "pending",
    progress: 0,
    currentStep: "Initializing import",
  };

  this.activeImports.set(importId, progress);

  // Start async processing
  this.processImport(importId, file, userId, familyId);

  return importId;
}
```

**2. Transaction-Based Import:**

```typescript
private async performImport(
  data: ImportMemberData[],
  userId: string,
  familyId?: string
): Promise<ImportResult> {
  await this.prisma.$transaction(async (tx) => {
    const memberMap = new Map<string, string>();

    // Create members
    for (const memberData of data) {
      const member = await tx.member.create({
        data: {
          name: memberData.name,
          gender: memberData.gender,
          status: memberData.status || MemberStatus.ACTIVE,
          personalInfo: memberData.personalInfo
            ? JSON.stringify(memberData.personalInfo)
            : null,
        },
      });
      memberMap.set(memberData.name.toLowerCase(), member.id);
    }

    // Create relationships
    await this.createRelationships(data, memberMap, tx, result);
  });
}
```

### Phase 6: Relationship Processing

**1. Parent-Child Relationships:**

```typescript
private async createRelationships(
  data: ImportMemberData[],
  memberMap: Map<string, string>,
  tx: any,
  result: ImportResult
): Promise<void> {
  for (const memberData of data) {
    const memberId = memberMap.get(memberData.name.toLowerCase());

    // Create parent relationships
    if (memberData.parentNames) {
      for (const parentName of memberData.parentNames) {
        const parentId = memberMap.get(parentName.toLowerCase());
        if (parentId) {
          await tx.member.update({
            where: { id: memberId },
            data: {
              parents: { connect: { id: parentId } },
            },
          });
        }
      }
    }
  }
}
```

### Phase 7: Progress Tracking & Response

**1. Real-time Progress Updates:**

```typescript
private updateProgress(importId: string, progress: ImportProgress): void {
  this.activeImports.set(importId, { ...progress });

  // Progress is tracked in memory and can be polled by frontend
  progress.status = "processing";
  progress.progress = Math.round((processedRecords / totalRecords) * 100);
  progress.currentStep = `Processing record ${processedRecords} of ${totalRecords}`;
}
```

**2. Frontend Progress Polling:**

```typescript
const pollImportProgress = async (id: string) => {
  const pollInterval = setInterval(async () => {
    const response = await fetch(`/api/import/progress/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const result = await response.json();
    setImportProgress(result.progress);

    if (
      result.progress.status === "completed" ||
      result.progress.status === "failed"
    ) {
      clearInterval(pollInterval);
    }
  }, 2000); // Poll every 2 seconds
};
```

### Phase 8: Error Handling & Rollback

**1. Transaction Rollback on Errors:**

```typescript
try {
  await this.prisma.$transaction(async (tx) => {
    // Import operations
    for (const memberData of data) {
      const member = await tx.member.create({
        /* ... */
      });

      if (!member) {
        throw new Error(`Failed to create member: ${memberData.name}`);
      }
    }
  });
} catch (error) {
  // Transaction automatically rolls back
  progress.status = "failed";
  progress.errors.push({
    row: 0,
    message: `Import failed: ${error.message}`,
  });
}
```

**2. Detailed Error Reporting:**

```typescript
const result: ImportResult = {
  success: false,
  totalRecords: data.length,
  successfulImports: 0,
  failedImports: 0,
  errors: [
    {
      row: index + 1,
      field: "name",
      message: "Member name is required",
      data: memberData,
    },
  ],
  warnings: [],
};
```

## Complete Data Flow Summary

1. **Frontend** → File selection → FormData creation → API call
2. **Backend** → File reception → Type detection → Parsing
3. **Validation** → Data validation → Sanitization → Error collection
4. **Database** → Transaction start → Member creation → Relationship creation
5. **Progress** → Real-time updates → Status tracking → Completion
6. **Response** → Success/failure → Error details → Import statistics

## Key Integration Points

- **Authentication**: JWT tokens for secure API access
- **File Upload**: Multer for handling multipart/form-data
- **Progress Tracking**: In-memory storage with polling mechanism
- **Transaction Safety**: Prisma transactions with automatic rollback
- **Error Recovery**: Comprehensive error collection and reporting
- **Relationship Mapping**: Name-based relationship resolution

---

# UI Component Locations

## File Input for Excel Import

**Location:** `family-tree-frontend/src/components/ImportManager.tsx` - Lines 320-332

```tsx
{
  /* File Selection */
}
<div className="space-y-2">
  <Label htmlFor="file-upload">Select File</Label>
  <Input
    id="file-upload"
    type="file"
    ref={fileInputRef}
    onChange={handleFileSelect}
    accept=".xlsx,.xls,.json"
    className="cursor-pointer"
  />
  {selectedFile && (
    <p className="text-sm text-muted-foreground">
      Selected: {selectedFile.name} (
      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
    </p>
  )}
</div>;
```

**Where it appears in the UI:**

- **Tab:** "Import Data" tab (first tab)
- **Section:** Top of the import form
- **Label:** "Select File"
- **Accepts:** `.xlsx`, `.xls`, `.json` files

## Template Download Buttons

**Location:** `family-tree-frontend/src/components/ImportManager.tsx` - Lines 540-560

```tsx
{
  /* Download Buttons */
}
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Download Templates</CardTitle>
    <CardDescription>
      Choose your preferred format and download a template with sample data.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    <Button
      onClick={() => downloadTemplate("excel")}
      className="w-full"
      variant="outline"
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Download Excel Template
    </Button>

    <Button
      onClick={() => downloadTemplate("json")}
      className="w-full"
      variant="outline"
    >
      <FileText className="mr-2 h-4 w-4" />
      Download JSON Template
    </Button>
  </CardContent>
</Card>;
```

**Where it appears in the UI:**

- **Tab:** "Download Templates" tab (second tab)
- **Section:** Right column of the template options grid
- **Buttons:**
  - "Download Excel Template" (with spreadsheet icon)
  - "Download JSON Template" (with file text icon)

## How to Access These Features

1. **To import an Excel file:**

   - Click on the **"Import Data"** tab
   - Click the **"Select File"** input field
   - Choose your Excel (.xlsx) or JSON file
   - Click **"Validate File"** to check the file
   - Click **"Start Import"** to begin the import process

2. **To download a template:**
   - Click on the **"Download Templates"** tab
   - Configure template options (size and sample data)
   - Click either **"Download Excel Template"** or **"Download JSON Template"**

## Component Structure

The ImportManager component uses a **tabbed interface** with two main sections:

```
ImportManager Component
├── Import Data Tab
│   ├── File Selection Input (.xlsx, .xls, .json)
│   ├── Import Name Field
│   ├── Validate File Button
│   ├── Validation Results
│   ├── Start Import Button
│   └── Progress Tracking
│
└── Download Templates Tab
    ├── Template Options (Size & Sample Data)
    ├── Download Excel Template Button
    └── Download JSON Template Button
```

The file input is prominently placed at the top of the import workflow, and the template download buttons are clearly visible in their own dedicated tab for easy access.
