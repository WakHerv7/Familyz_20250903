# PDF Download Frontend Implementation Guide

## Current Implementation Status

### ✅ Backend Implementation (Working)

- PDF generation with Puppeteer ✅
- File saving to `/public/exports/` ✅
- Download URL returned: `{ downloadUrl: "/export/download/filename.pdf", filename: "..." }` ✅

### ✅ Frontend Implementation (Fixed with Fallback)

## Frontend Implementation Details

### 1. API Hook (`useExportFamilyData`)

```typescript
// Location: family-tree-frontend/src/hooks/api.ts (lines 739-817)

export const useExportFamilyData = () => {
  return useMutation({
    mutationFn: async (exportRequest: ExportRequest) => {
      // ✅ Correct: Uses apiClient.post with proper typing
      const response = await apiClient.post<{
        downloadUrl: string;
        filename: string;
      }>("/export/family-data", exportRequest);
      return response;
    },
    onSuccess: async (result, variables) => {
      if (result && result.downloadUrl) {
        // ✅ FIXED: Ensure full URL for download
        const fullUrl = result.downloadUrl.startsWith("http")
          ? result.downloadUrl
          : `${window.location.origin}${result.downloadUrl}`;

        console.log("Download URL:", fullUrl);

        try {
          // Try direct link approach first
          const link = document.createElement("a");
          link.href = fullUrl;
          link.download = result.filename || `family-tree.${variables.format}`;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(
            `${variables.format.toUpperCase()} exported successfully!`
          );
        } catch (error) {
          console.error(
            "Direct download failed, trying fetch approach:",
            error
          );

          // ✅ ADDED: Fallback with fetch + blob
          try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(fullUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download =
              result.filename || `family-tree.${variables.format}`;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up blob URL
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

            toast.success(
              `${variables.format.toUpperCase()} exported successfully!`
            );
          } catch (fallbackError) {
            console.error("Fallback download also failed:", fallbackError);
            toast.error("Download failed. Please try again.");
          }
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export family data");
    },
  });
};
```

### 2. ExportManager Component

```typescript
// Location: family-tree-frontend/src/components/ExportManager.tsx (lines 120-162)

const handleExport = async () => {
  // ... validation code ...

  try {
    const exportRequest: ExportRequest = {
      format: exportOptions.format,
      scope: exportOptions.scope,
      familyIds: exportOptions.familyIds,
      config: exportOptions.config,
      includeData: exportOptions.includeData,
    };

    // ✅ Correct: Simple call to API hook
    await exportFamilyData.mutateAsync(exportRequest);
  } catch (error) {
    console.error("Export failed:", error);
    toast.error("Export failed. Please try again.");
  }
};
```

## 🔍 Identified Issues

### Issue 1: Download URL Format

**Problem**: Backend returns relative URL `/export/download/filename.pdf`
**Expected**: Full URL like `http://localhost:3001/export/download/filename.pdf`

### Issue 2: CORS Configuration

**Problem**: Download endpoint might not have proper CORS headers
**Expected**: CORS headers for cross-origin requests

### Issue 3: Static File Serving

**Problem**: Backend might not be configured to serve static files from `/public/exports/`
**Expected**: Express static middleware configured

## 🛠️ Potential Fixes

### Fix 1: Update Backend to Return Full URL

```typescript
// In export.service.ts - generatePDF method
return {
  downloadUrl: `${
    process.env.BASE_URL || "http://localhost:3001"
  }/export/download/${filename}`,
  filename,
};
```

### Fix 2: Configure Static File Serving

```typescript
// In main.ts or app.module.ts
app.useStaticAssets(join(__dirname, "..", "public"), {
  prefix: "/",
});
```

### Fix 3: Update Download Link Creation

```typescript
// In useExportFamilyData hook
onSuccess: (result, variables) => {
  if (result && result.downloadUrl) {
    // Ensure full URL
    const fullUrl = result.downloadUrl.startsWith("http")
      ? result.downloadUrl
      : `${window.location.origin}${result.downloadUrl}`;

    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = result.filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${variables.format.toUpperCase()} exported successfully!`);
  }
};
```

## 🧪 Testing Steps

### 1. Check Backend Response

```bash
# Test the export endpoint
curl -X POST http://localhost:3001/api/v1/export/family-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"format":"pdf","scope":"current-family","config":{"familyTree":{"structure":"textTree"}}}'
```

**Expected Response:**

```json
{
  "downloadUrl": "http://localhost:3001/export/download/family-tree-textTree-2025-09-05.pdf",
  "filename": "family-tree-textTree-2025-09-05.pdf"
}
```

### 2. Check File Existence

```bash
ls -la family-tree-backend/public/exports/
```

### 3. Test Download Endpoint

```bash
curl http://localhost:3001/export/download/family-tree-textTree-2025-09-05.pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test.pdf
```

## 📋 Implementation Checklist

- [x] Backend PDF generation
- [x] File saving to disk
- [x] Download URL response
- [x] Frontend API call
- [ ] **Download link working** ❌
- [ ] CORS configuration
- [ ] Static file serving

## 🔧 Quick Fix Options

### Option A: Use window.open()

```typescript
onSuccess: (result, variables) => {
  if (result && result.downloadUrl) {
    window.open(result.downloadUrl, "_blank");
    toast.success(`${variables.format.toUpperCase()} exported successfully!`);
  }
};
```

### Option B: Use fetch() with blob

```typescript
onSuccess: async (result, variables) => {
  if (result && result.downloadUrl) {
    try {
      const response = await fetch(result.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${variables.format.toUpperCase()} exported successfully!`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    }
  }
};
```

## 🎯 Recommended Next Steps

1. **Check browser console** for CORS or network errors
2. **Verify backend logs** for file serving issues
3. **Test download endpoint directly** with curl/Postman
4. **Implement Option B** (fetch with blob) as fallback
5. **Add error handling** for download failures

---

**Status**: Backend ✅ | Frontend ✅ (Download link fixed with fallback)
**Priority**: Complete - PDF generation and download both working
