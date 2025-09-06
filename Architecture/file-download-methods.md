# Family Tree File Download Methods

This document outlines the two primary methods for downloading exported family tree files from the Family Tree application.

## Method 1: Direct Static File Access (No Authentication)

### Overview

Static files are served directly from the server's public directory without requiring authentication. This method is simple and doesn't require API calls or tokens.

### Server Configuration

- **Port:** 3001 (configured in `.env`)
- **Static Files Path:** `/public/exports/`
- **Base URL:** `http://localhost:3001`

### Available Files

Based on current exports folder contents:

- `000.pdf`, `001.pdf`, `003.pdf`, `004.pdf`
- `005.xlsx`
- `family-tree-excel-2025-09-05.xlsx`
- `family-tree-textTree-2025-09-05.html`
- `family-tree-textTree-2025-09-05.pdf`
- `003.html`, `004.html`

### Direct Download URLs

#### PDF Files

```
http://localhost:3001/public/exports/000.pdf
http://localhost:3001/public/exports/001.pdf
http://localhost:3001/public/exports/003.pdf
http://localhost:3001/public/exports/family-tree-textTree-2025-09-05.pdf
```

#### Excel Files

```
http://localhost:3001/public/exports/005.xlsx
http://localhost:3001/public/exports/family-tree-excel-2025-09-05.xlsx
```

#### HTML Files

```
http://localhost:3001/public/exports/003.html
http://localhost:3001/public/exports/004.html
http://localhost:3001/public/exports/family-tree-textTree-2025-09-05.html
```

### Usage

Simply copy and paste any URL above directly into your browser address bar. The file will download immediately.

### Advantages

- ✅ No authentication required
- ✅ Simple direct access
- ✅ Works in any browser
- ✅ No API calls needed

### Disadvantages

- ❌ No security controls
- ❌ No access logging
- ❌ Files are publicly accessible

---

## Method 2: API Endpoint with JWT Authentication

### Overview

Files are downloaded through a secure API endpoint that requires JWT authentication. This method provides proper security and access control.

### Endpoint Details

- **Method:** `GET`
- **Full URL:** `http://localhost:3001/api/v1/export/download/{filename}`
- **Authentication:** Required (JWT Bearer Token)
- **Headers:** `Authorization: Bearer {your-jwt-token}`

### API Endpoint URLs

#### PDF Files

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/v1/export/download/family-tree-textTree-2025-09-05.pdf \
     -o downloaded-file.pdf
```

#### Excel Files

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/v1/export/download/family-tree-excel-2025-09-05.xlsx \
     -o downloaded-file.xlsx
```

#### HTML Files

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/v1/export/download/family-tree-textTree-2025-09-05.html \
     -o downloaded-file.html
```

### Getting JWT Token

You can obtain a JWT token by:

1. Logging in through the frontend application
2. Using the login API: `POST /api/v1/auth/login`
3. Checking browser localStorage for `accessToken`

### Browser Access

For direct browser access with authentication:

1. Open browser developer tools
2. Add Authorization header: `Bearer YOUR_JWT_TOKEN`
3. Navigate to the API endpoint URL

### Advantages

- ✅ Secure authentication required
- ✅ Access control and permissions
- ✅ Audit trail and logging
- ✅ Proper HTTP headers and content types
- ✅ Better error handling

### Disadvantages

- ❌ Requires valid JWT token
- ❌ More complex to use
- ❌ Token expiration handling needed

---

## Comparison Table

| Feature             | Static Access    | API Endpoint         |
| ------------------- | ---------------- | -------------------- |
| **Authentication**  | ❌ None          | ✅ JWT Required      |
| **Security**        | ❌ Public access | ✅ Secure            |
| **Simplicity**      | ✅ Very simple   | ❌ Requires token    |
| **Access Control**  | ❌ None          | ✅ User permissions  |
| **Logging**         | ❌ None          | ✅ Download tracking |
| **Error Handling**  | ❌ Basic         | ✅ Comprehensive     |
| **Browser Support** | ✅ All browsers  | ✅ All browsers      |
| **API Calls**       | ❌ None          | ✅ Required          |

## Implementation Details

### Static File Serving (main.ts)

```typescript
// Static file serving for exports
app.useStaticAssets(join(__dirname, "..", "public"), {
  prefix: "/public/",
});
```

### API Endpoint (export.controller.ts)

```typescript
@Get("download/:filename")
async downloadFile(
  @Param("filename") filename: string,
  @Res() res: Response
): Promise<void> {
  // File validation and streaming logic
}
```

## Recommendations

### Use Static Access When:

- Testing file downloads quickly
- No security concerns
- Simple file sharing
- Development/debugging

### Use API Endpoint When:

- Production environment
- User authentication required
- Access control needed
- Download tracking required
- Secure file distribution

## File Security Notes

- Static files are publicly accessible without authentication
- API endpoints require valid JWT tokens
- Consider implementing file cleanup for old exports
- Monitor disk usage for export files
- Implement rate limiting for download endpoints

---

_Document generated on: September 6, 2025_
_Based on Family Tree application backend configuration_
