# Massive Input Import Plan - Excel & JSON File Support

## Overview

This plan outlines the implementation of a comprehensive bulk import system that allows users to import large amounts of family tree data from Excel (.xlsx) and JSON files. The system will support creating multiple family members and establishing complex relationships in a single operation.

## Current System Analysis

Based on the existing codebase, we have:

- **Export Service**: Already handles Excel generation with ExcelJS
- **Upload Service**: Handles file uploads and storage
- **Member Service**: Manages member creation and relationships
- **Database Schema**: Supports members, families, and relationships

## Implementation Plan

### Phase 1: Backend Infrastructure

#### 1.1 Import Service Architecture

- [ ] Create `ImportService` in `family-tree-backend/src/import/`
- [ ] Implement file type detection (Excel vs JSON)
- [ ] Add import validation and error handling
- [ ] Support transaction-based imports with rollback capability

#### 1.2 File Parsing Modules

- [ ] **Excel Parser**: Use existing ExcelJS integration
  - Parse worksheets for member data
  - Handle multiple sheets (members, relationships, families)
  - Support custom column mappings
- [ ] **JSON Parser**: Create JSON schema validation
  - Define JSON import format specification
  - Validate data structure and relationships
  - Support nested relationship definitions

#### 1.3 Data Validation Engine

- [ ] Create validation rules for:
  - Required fields (name, gender)
  - Data type validation (dates, emails)
  - Relationship consistency (prevent circular references)
  - Duplicate detection (name + birth date matching)
- [ ] Implement validation error reporting with line numbers
- [ ] Add data sanitization and normalization

#### 1.4 Bulk Processing Engine

- [ ] Implement batch processing for large datasets
- [ ] Add progress tracking and status reporting
- [ ] Support partial imports with error recovery
- [ ] Implement import queuing for concurrent requests

### Phase 2: Data Models & DTOs

#### 2.1 Import Data Structures

- [ ] Define `ImportMemberDto` with all possible fields
- [ ] Create `ImportRelationshipDto` for relationship definitions
- [ ] Add `ImportFamilyDto` for family creation
- [ ] Implement `ImportResultDto` for operation feedback

#### 2.2 Import Configuration

- [ ] Add import settings (skip duplicates, update existing)
- [ ] Support custom field mappings
- [ ] Add import templates and examples

### Phase 3: Import Processing Logic

#### 3.1 Member Creation Pipeline

- [ ] Parse and validate member data
- [ ] Handle duplicate detection and merging
- [ ] Create family memberships automatically
- [ ] Process personal information and metadata

#### 3.2 Relationship Establishment

- [ ] Implement relationship type detection
- [ ] Handle bidirectional relationship creation
- [ ] Support complex relationship networks
- [ ] Add relationship validation and conflict resolution

#### 3.3 Error Handling & Recovery

- [ ] Implement transaction rollback on failures
- [ ] Add detailed error reporting with context
- [ ] Support partial success scenarios
- [ ] Create import logs and audit trails

### Phase 4: Frontend Implementation

#### 4.1 Import UI Components

- [ ] Create `ImportManager` component
- [ ] Add file upload interface with drag-and-drop
- [ ] Implement import progress visualization
- [ ] Add import history and status tracking

#### 4.1.1 Template Generation & Download

- [ ] Create `TemplateGenerator` service for Excel templates
- [ ] Implement template download endpoints for both Excel and JSON formats
- [ ] Add sample data population in templates with realistic examples
- [ ] Create template customization options (include sample data, different sizes)
- [ ] Add template versioning and format documentation

#### 4.2 Data Preview & Mapping

- [ ] Add data preview before import
- [ ] Implement column mapping interface
- [ ] Show validation errors and warnings
- [ ] Add import configuration options

#### 4.3 Import Monitoring

- [ ] Real-time progress updates
- [ ] Error reporting and resolution
- [ ] Import statistics and summaries
- [ ] Download import reports

### Phase 5: Template Generation & Download System

#### 5.1 Template Generation Service

- [ ] Create `TemplateService` in backend for generating downloadable templates
- [ ] Implement Excel template generation with proper formatting and headers
- [ ] Create JSON template generation with schema validation
- [ ] Add sample data population options (empty, minimal, comprehensive examples)
- [ ] Support template customization (field selection, sample data size)

#### 5.2 Template Download Endpoints

- [ ] `GET /api/v1/import/template/excel` - Download Excel template
- [ ] `GET /api/v1/import/template/json` - Download JSON template
- [ ] Query parameters for customization:
  - `sampleData=true` - Include sample data
  - `size=small|medium|large` - Template size
  - `fields=all|required|custom` - Field selection

#### 5.3 Template Features

- [ ] Pre-formatted Excel sheets with data validation dropdowns
- [ ] Color-coded columns (required vs optional)
- [ ] Sample data that demonstrates all relationship types
- [ ] Instructions sheet in Excel templates
- [ ] JSON schema documentation in template comments

#### 5.4 Template Management

- [ ] Template versioning system
- [ ] Cache generated templates for performance
- [ ] Update templates when schema changes
- [ ] Multi-language template support

### Phase 6: File Format Specifications

#### 6.1 Excel Format Specification

```
Sheet 1: Members
| Column | Required | Description |
|--------|----------|-------------|
| name | Yes | Full name |
| gender | Yes | MALE/FEMALE/OTHER |
| birthDate | No | YYYY-MM-DD |
| email | No | Email address |
| phone | No | Phone number |
| bio | No | Biography |
| occupation | No | Job title |

Sheet 2: Relationships
| Column | Required | Description |
|--------|----------|-------------|
| member1 | Yes | Member name or ID |
| member2 | Yes | Related member name or ID |
| relationship | Yes | PARENT/CHILD/SPOUSE |
| family | No | Family name (optional) |
```

#### 6.2 JSON Format Specification

```json
{
  "families": [
    {
      "name": "Smith Family",
      "members": [
        {
          "name": "John Smith",
          "gender": "MALE",
          "birthDate": "1980-01-15",
          "personalInfo": {
            "bio": "Family patriarch",
            "occupation": "Engineer"
          }
        }
      ],
      "relationships": [
        {
          "member1": "John Smith",
          "member2": "Jane Smith",
          "type": "SPOUSE"
        }
      ]
    }
  ]
}
```

### Phase 7: Security & Performance

#### 7.1 Security Measures

- [ ] File type validation and malware scanning
- [ ] Size limits and rate limiting
- [ ] User permission validation
- [ ] Data sanitization and XSS protection

#### 7.2 Performance Optimization

- [ ] Implement streaming for large files
- [ ] Add database indexing for import operations
- [ ] Optimize bulk insert operations
- [ ] Add caching for frequently accessed data

### Phase 8: Testing & Documentation

#### 8.1 Testing Strategy

- [ ] Unit tests for parsing and validation
- [ ] Integration tests for full import workflows
- [ ] Performance tests for large datasets
- [ ] Error handling and edge case testing

#### 8.2 Documentation

- [ ] API documentation for import endpoints
- [ ] User guide for file format specifications
- [ ] Troubleshooting guide for common issues
- [ ] Sample files and templates

## Implementation Timeline

### Week 1-2: Core Infrastructure

- Set up import service architecture
- Implement basic file parsing
- Create data validation engine

### Week 3-4: Processing Logic

- Build member creation pipeline
- Implement relationship establishment
- Add error handling and recovery

### Week 5-6: Frontend Integration

- Create import UI components
- Implement data preview and mapping
- Add progress monitoring

### Week 7-8: Testing & Refinement

- Comprehensive testing
- Performance optimization
- Documentation completion

## Success Metrics

- [ ] Support for Excel files up to 10,000 rows
- [ ] JSON import for complex relationship structures
- [ ] 99% data accuracy with validation
- [ ] Import completion within 5 minutes for large files
- [ ] Comprehensive error reporting and recovery

## Risk Mitigation

- **Data Loss**: Transaction-based imports with rollback
- **Performance**: Streaming processing for large files
- **User Experience**: Progress tracking and error feedback
- **Security**: File validation and permission checks

## Future Enhancements

- [ ] Support for CSV files
- [ ] Import from GEDCOM format (genealogy standard)
- [ ] AI-powered data matching and deduplication
- [ ] Integration with external genealogy services
- [ ] Mobile app import capabilities

---

_This plan provides a comprehensive roadmap for implementing massive input functionality. Each phase builds upon the previous one, ensuring a robust and scalable solution._
