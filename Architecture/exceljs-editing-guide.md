# ExcelJS - Editing Existing Excel Files

## Overview

ExcelJS is a powerful library for reading, editing, and writing Excel files. Yes, you can absolutely edit existing Excel files while preserving formatting, formulas, and structure.

## Basic Editing Pattern

```typescript
import * as ExcelJS from "exceljs";

// 1. Read existing file
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile("path/to/existing-file.xlsx");

// 2. Get worksheet
const worksheet = workbook.getWorksheet("Sheet1"); // by name
// OR
const worksheet = workbook.getWorksheet(1); // by index

// 3. Edit cells/data
worksheet.getCell("A1").value = "New Value";
worksheet.getCell("B2").value = 42;

// 4. Save changes
await workbook.xlsx.writeFile("path/to/updated-file.xlsx");
```

## Common Editing Operations

### 1. Modify Cell Values

```typescript
// Direct cell modification
worksheet.getCell("A1").value = "Updated Text";
worksheet.getCell("B1").value = new Date();
worksheet.getCell("C1").value = 123.45;

// Using row/column coordinates
worksheet.getCell(1, 1).value = "Row 1, Col 1"; // A1
worksheet.getCell(2, 3).value = "Row 2, Col 3"; // C2
```

### 2. Add New Rows/Data

```typescript
// Add rows
worksheet.addRow(["Name", "Age", "City"]);
worksheet.addRow(["John", 30, "New York"]);

// Insert rows at specific position
worksheet.insertRow(2, ["Inserted", "Row", "Data"]);
```

### 3. Modify Existing Rows

```typescript
// Get and modify existing row
const row = worksheet.getRow(2);
row.getCell(1).value = "Modified Name";
row.getCell(2).value = 35;
row.commit(); // Important: commit changes
```

### 4. Add New Worksheets

```typescript
// Add new worksheet to existing workbook
const newSheet = workbook.addWorksheet("New Sheet");
newSheet.getCell("A1").value = "New Sheet Data";
```

## Practical Example for Family Tree

```typescript
async function updateFamilyTreeExcel(filePath: string, newMembers: any[]) {
  const workbook = new ExcelJS.Workbook();

  // Read existing file
  await workbook.xlsx.readFile(filePath);

  // Get the members sheet
  const membersSheet = workbook.getWorksheet("Members List");

  if (membersSheet) {
    // Find the last row with data
    let lastRow = membersSheet.lastRow?.number || 5; // Start after headers

    // Add new members
    newMembers.forEach((member, index) => {
      const row = lastRow + index + 1;
      membersSheet.getCell(`A${row}`).value = member.id;
      membersSheet.getCell(`B${row}`).value = member.name;
      membersSheet.getCell(`C${row}`).value = member.gender;
      membersSheet.getCell(`D${row}`).value = member.generation;
      membersSheet.getCell(`E${row}`).value = member.role;
    });

    // Update total count in header
    membersSheet.getCell("A3").value = `Total Members: ${
      membersSheet.lastRow?.number - 5
    }`;
  }

  // Save updated file
  await workbook.xlsx.writeFile(filePath);
}
```

## Advanced Editing Features

### 1. Preserve Formatting

```typescript
// Read file preserving styles
await workbook.xlsx.readFile(filePath);

// Modify content while keeping formatting
const cell = worksheet.getCell("A1");
cell.value = "New Value";
// Formatting (font, fill, border) is preserved automatically
```

### 2. Conditional Updates

```typescript
// Update cells based on conditions
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber > 1) {
    // Skip header
    const nameCell = row.getCell(1);
    if (nameCell.value === "Old Name") {
      nameCell.value = "New Name";
    }
  }
});
```

### 3. Formula Updates

```typescript
// Update formulas
worksheet.getCell("D10").value = { formula: "SUM(D1:D9)" };
```

## Error Handling

```typescript
try {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // Edit operations...

  await workbook.xlsx.writeFile(filePath);
  console.log("File updated successfully");
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("File not found, creating new file...");
    // Create new file logic
  } else {
    console.error("Error updating Excel file:", error);
  }
}
```

## Key Benefits

- ✅ **Preserves existing formatting** and styles
- ✅ **Maintains formulas** and references
- ✅ **Keeps multiple worksheets** intact
- ✅ **Non-destructive editing** - only changes what you specify
- ✅ **Full control** over cells, rows, columns, and sheets

## Usage in Your Family Tree Application

```typescript
// Example: Update existing family tree export
const filePath =
  "family-tree-backend/public/exports/family-tree-excel-2025-09-05.xlsx";

await updateFamilyTreeExcel(filePath, [
  {
    id: "123",
    name: "New Member",
    gender: "MALE",
    generation: 3,
    role: "MEMBER",
  },
]);
```

## Important Notes

1. **File Locking**: Make sure the file isn't open in Excel when editing
2. **Backup**: Consider creating backups before bulk edits
3. **Memory**: Large files may require more memory
4. **Formulas**: ExcelJS preserves most formulas but complex ones may need recalculation

This approach is perfect for updating your family tree exports - you can read existing Excel files, add new members, update existing data, and save the changes while preserving all the original formatting and structure!
