# Family Tree Relationship Management Backend

## Overview

This document provides a comprehensive guide to how relationships are managed in the family tree backend system. It covers the relationship types, database structure, business logic, conflict resolution strategies, and various scenarios that can occur when creating relationships between family members.

## Table of Contents

1. [Relationship Types](#relationship-types)
2. [Database Structure](#database-structure)
3. [Bidirectional Relationship Logic](#bidirectional-relationship-logic)
4. [Relationship Creation Process](#relationship-creation-process)
5. [Conflict Resolution Strategies](#conflict-resolution-strategies)
6. [Edge Cases and Error Handling](#edge-cases-and-error-handling)
7. [Real-World Scenarios](#real-world-scenarios)
8. [API Endpoints](#api-endpoints)
9. [Testing and Validation](#testing-and-validation)

## Relationship Types

The system supports three primary relationship types:

### 1. PARENT Relationship

- **Description**: Establishes a parent-child relationship
- **Direction**: Bidirectional (creates both parent→child and child→parent links)
- **Multiple Allowed**: Yes (a person can have multiple parents)
- **Example**: "Jamie is the parent of Hermann"

### 2. CHILD Relationship

- **Description**: Establishes a child-parent relationship
- **Direction**: Bidirectional (creates both child→parent and parent→child links)
- **Multiple Allowed**: Yes (a parent can have multiple children)
- **Example**: "Hermann is the child of Jamie"

### 3. SPOUSE Relationship

- **Description**: Establishes a marital relationship
- **Direction**: Bidirectional (creates mutual spouse links)
- **Multiple Allowed**: Yes (supports polygamy and multiple marriages)
- **Example**: "Jamie is the spouse of Hermann"

## Database Structure

### Prisma Schema

```prisma
model Member {
  id        String   @id @default(uuid())
  name      String
  gender    Gender?

  // Self-referential many-to-many relationships
  parents  Member[] @relation("ParentChild")  // Parents of this member
  children Member[] @relation("ParentChild")  // Children of this member

  spouses         Member[] @relation("Spouses")  // Spouses (one direction)
  spousesReverse  Member[] @relation("Spouses")  // Spouses (reverse direction)
}
```

### Generated Database Tables

Prisma automatically creates junction tables for many-to-many relationships:

#### `_ParentChild` Table

```sql
CREATE TABLE "_ParentChild" (
  "A" TEXT NOT NULL,  -- Parent Member ID
  "B" TEXT NOT NULL,  -- Child Member ID
  FOREIGN KEY ("A") REFERENCES "members"("id"),
  FOREIGN KEY ("B") REFERENCES "members"("id")
);
```

#### `_Spouses` Table

```sql
CREATE TABLE "_Spouses" (
  "A" TEXT NOT NULL,  -- Spouse A Member ID
  "B" TEXT NOT NULL,  -- Spouse B Member ID
  FOREIGN KEY ("A") REFERENCES "members"("id"),
  FOREIGN KEY ("B") REFERENCES "members"("id")
);
```

### Table Structure Details

- **Column "A"**: First member in the relationship
- **Column "B"**: Second member in the relationship
- **Foreign Keys**: Ensure referential integrity
- **No additional metadata**: Simple junction table design

## Bidirectional Relationship Logic

### How Relationships Are Created

When a relationship is created, the system automatically creates the reverse relationship to maintain data consistency:

#### PARENT Relationship Creation

```typescript
// User creates: "Jamie is parent of Hermann"
// System creates:
await prisma.member.update({
  where: { id: "hermann-id" }, // Child
  data: {
    parents: { connect: { id: "jamie-id" } }, // Parent
  },
});

await prisma.member.update({
  where: { id: "jamie-id" }, // Parent
  data: {
    children: { connect: { id: "hermann-id" } }, // Child
  },
});
```

#### CHILD Relationship Creation

```typescript
// User creates: "Hermann is child of Jamie"
// System creates:
await prisma.member.update({
  where: { id: "jamie-id" }, // Parent
  data: {
    children: { connect: { id: "hermann-id" } }, // Child
  },
});

await prisma.member.update({
  where: { id: "hermann-id" }, // Child
  data: {
    parents: { connect: { id: "jamie-id" } }, // Parent
  },
});
```

#### SPOUSE Relationship Creation

```typescript
// User creates: "Jamie is spouse of Hermann"
// System creates:
await prisma.member.update({
  where: { id: "hermann-id" },
  data: {
    spouses: { connect: { id: "jamie-id" } },
  },
});

// Prisma handles the reverse relationship automatically
```

## Relationship Creation Process

### Step-by-Step Process

1. **Input Validation**

   - Verify both members exist
   - Check user permissions (same family)
   - Prevent self-relationships
   - Validate relationship type

2. **Pre-Creation Checks**

   - Check for existing relationships (depending on type)
   - Apply conflict resolution logic
   - Log relationship details

3. **Database Transaction**

   - Create relationship in transaction
   - Ensure atomicity (all-or-nothing)
   - Rollback on failure

4. **Bidirectional Updates**

   - Create forward relationship
   - Create reverse relationship
   - Update both members' relationship arrays

5. **Post-Creation**
   - Log success/failure
   - Return response to client
   - Trigger any necessary updates

### Transaction Wrapper

All relationship operations use database transactions:

```typescript
return this.prisma.$transaction(async (prisma) => {
  // Relationship creation logic here
  // If any step fails, entire transaction rolls back
});
```

## Conflict Resolution Strategies

### Current Strategy: Manual Management

The system uses a **manual management** approach where:

- **No automatic deletion** of existing relationships
- **Users manually manage** their relationships
- **Multiple relationships** of the same type are allowed
- **No artificial constraints** based on traditional family structures

### Relationship-Specific Rules

#### PARENT Relationships

```typescript
case "PARENT":
  // No automatic conflict resolution
  // Allow multiple parents of same gender
  // Examples: biological + adoptive parents
```

#### CHILD Relationships

```typescript
case "CHILD":
  // No automatic conflict resolution
  // Allow multiple children per parent
  // Allow multiple parents per child
```

#### SPOUSE Relationships

```typescript
case "SPOUSE":
  // No automatic conflict resolution
  // Allow multiple spouses
  // Support polygamy and multiple marriages
```

### Why This Approach?

1. **Realistic Family Structures**: Modern families are diverse
2. **User Control**: Users decide relationship validity
3. **Cultural Flexibility**: Supports various cultural norms
4. **Legal Complexity**: Handles adoption, guardianship, etc.

## What Happens When Creating Relationships Between People with Existing Relationships?

### Scenario Analysis

#### Scenario 1: Creating PARENT Relationship with Existing Parents

**Initial State:**

```
Hermann Smith (Male)
├── Parents: [Mary Smith (Female, Biological Mother)]
└── Children: []

Jamie Smith (Female)
├── Parents: []
└── Children: []
```

**Action:** Create "Jamie is parent of Hermann"

**Result:**

```
Hermann Smith (Male)
├── Parents: [Mary Smith (Female), Jamie Smith (Female)]
└── Children: []

Jamie Smith (Female)
├── Parents: []
└── Children: [Hermann Smith (Male)]
```

**What Happens:**

- ✅ Hermann gets Jamie as an additional parent
- ✅ Jamie gets Hermann as a child
- ✅ Mary remains as Hermann's parent
- ✅ No relationships are automatically removed

#### Scenario 2: Creating SPOUSE Relationship with Existing Spouses

**Initial State:**

```
John Doe (Male)
├── Spouses: [Jane Doe (Female)]
└── Children: []

Mary Smith (Female)
├── Spouses: []
└── Children: []
```

**Action:** Create "Mary is spouse of John"

**Result:**

```
John Doe (Male)
├── Spouses: [Jane Doe (Female), Mary Smith (Female)]
└── Children: []

Mary Smith (Female)
├── Spouses: [John Doe (Male)]
└── Children: []
```

**What Happens:**

- ✅ John gets Mary as an additional spouse
- ✅ Mary gets John as a spouse
- ✅ Jane remains as John's spouse
- ✅ No relationships are automatically removed

#### Scenario 3: Creating CHILD Relationship with Existing Children

**Initial State:**

```
Sarah Johnson (Female)
├── Parents: []
└── Children: [Tom Johnson (Male)]

Mike Wilson (Male)
├── Parents: []
└── Children: []
```

**Action:** Create "Mike is child of Sarah"

**Result:**

```
Sarah Johnson (Female)
├── Parents: []
└── Children: [Tom Johnson (Male), Mike Wilson (Male)]

Mike Wilson (Male)
├── Parents: [Sarah Johnson (Female)]
└── Children: []
```

**What Happens:**

- ✅ Sarah gets Mike as an additional child
- ✅ Mike gets Sarah as a parent
- ✅ Tom remains as Sarah's child
- ✅ No relationships are automatically removed

### Duplicate Relationship Prevention

The system prevents duplicate relationships:

```typescript
// Check if relationship already exists
const existingRelationship = await prisma.member.findUnique({
  where: { id: user.memberId },
  select: {
    parents: { where: { id: relationshipDto.relatedMemberId } },
    children: { where: { id: relationshipDto.relatedMemberId } },
    spouses: { where: { id: relationshipDto.relatedMemberId } },
  },
});

if (
  existingRelationship.parents.length > 0 ||
  existingRelationship.children.length > 0 ||
  existingRelationship.spouses.length > 0
) {
  throw new BadRequestException("Relationship already exists");
}
```

## Edge Cases and Error Handling

### 1. Self-Relationship Prevention

```typescript
if (user.memberId === relationshipDto.relatedMemberId) {
  throw new BadRequestException("Cannot create relationship with yourself");
}
```

### 2. Non-existent Member

```typescript
const relatedMember = await prisma.member.findUnique({
  where: { id: relationshipDto.relatedMemberId },
});

if (!relatedMember) {
  throw new NotFoundException("Related member not found");
}
```

### 3. Permission Denied

```typescript
await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
// Throws ForbiddenException if members are not in the same family
```

### 4. Transaction Failures

```typescript
return this.prisma.$transaction(async (prisma) => {
  // If any database operation fails, entire transaction rolls back
  // No partial relationship creation
});
```

### 5. Invalid Relationship Type

```typescript
switch (relationshipDto.relationshipType) {
  case "PARENT":
  case "CHILD":
  case "SPOUSE":
    // Valid types
    break;
  default:
    throw new BadRequestException("Invalid relationship type");
}
```

## Real-World Scenarios

### Scenario 1: Adoption

**Context:** Child has biological parents and is adopted by another family

**Relationships Created:**

1. Biological Mother → Child (PARENT)
2. Biological Father → Child (PARENT)
3. Adoptive Mother → Child (PARENT)
4. Adoptive Father → Child (PARENT)

**Result:** Child has 4 parents, all properly tracked

### Scenario 2: Blended Family

**Context:** Two divorced parents remarry with new spouses

**Relationships Created:**

1. Child → Biological Mother (PARENT)
2. Child → Biological Father (PARENT)
3. Child → Step-Mother (PARENT)
4. Child → Step-Father (PARENT)
5. Biological Mother → New Husband (SPOUSE)
6. Biological Father → New Wife (SPOUSE)

**Result:** Complex family structure accurately represented

### Scenario 3: Polygamous Marriage

**Context:** Person has multiple spouses

**Relationships Created:**

1. Person A → Spouse 1 (SPOUSE)
2. Person A → Spouse 2 (SPOUSE)
3. Person A → Spouse 3 (SPOUSE)

**Result:** All marital relationships maintained

### Scenario 4: Foster Care

**Context:** Child in foster care with multiple caregivers

**Relationships Created:**

1. Child → Biological Mother (PARENT)
2. Child → Biological Father (PARENT)
3. Child → Foster Mother (PARENT)
4. Child → Foster Father (PARENT)
5. Child → Case Worker (PARENT - if designated guardian)

**Result:** All caregiving relationships tracked

## API Endpoints

### Create Relationship

```typescript
POST /api/v1/members/relationships
{
  "relatedMemberId": "uuid",
  "relationshipType": "PARENT" | "CHILD" | "SPOUSE",
  "familyId": "uuid"
}
```

### Remove Relationship

```typescript
DELETE /api/v1/members/relationships
{
  "relatedMemberId": "uuid",
  "relationshipType": "PARENT" | "CHILD" | "SPOUSE"
}
```

### Get Member Relationships

```typescript
GET /api/v1/members/:memberId
// Returns member with parents, children, spouses arrays
```

## Testing and Validation

### Unit Tests

```typescript
describe("RelationshipService", () => {
  it("should create bidirectional parent-child relationship", async () => {
    // Test PARENT relationship creation
  });

  it("should allow multiple parents of same gender", async () => {
    // Test multiple parent scenario
  });

  it("should prevent self-relationships", async () => {
    // Test self-relationship prevention
  });

  it("should handle transaction failures", async () => {
    // Test rollback on failure
  });
});
```

### Integration Tests

```typescript
describe("Relationship API", () => {
  it("should create relationship and return success", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/members/relationships")
      .send({
        relatedMemberId: "member-uuid",
        relationshipType: "PARENT",
        familyId: "family-uuid",
      })
      .expect(201);
  });

  it("should return 400 for invalid relationship type", async () => {
    // Test validation
  });
});
```

## Performance Considerations

### Database Indexes

- Indexes on member IDs in junction tables
- Composite indexes for common queries
- Foreign key indexes for referential integrity

### Query Optimization

```typescript
// Optimized query with select
const member = await prisma.member.findUnique({
  where: { id: memberId },
  select: {
    id: true,
    name: true,
    parents: { select: { id: true, name: true } },
    children: { select: { id: true, name: true } },
    spouses: { select: { id: true, name: true } },
  },
});
```

### Caching Strategy

- Cache frequently accessed relationship data
- Invalidate cache on relationship changes
- Use Redis for distributed caching

## Monitoring and Logging

### Relationship Creation Logs

```javascript
console.log(`[Relationship Service] Adding ${relationshipType} relationship`);
console.log(`[Relationship Service] Current user: ${userId} (${userName})`);
console.log(
  `[Relationship Service] Related member: ${relatedId} (${relatedName})`
);
console.log(
  `[Relationship Service] ${relationshipType} relationship created successfully`
);
```

### Error Logs

```javascript
console.error(`[Relationship Service] Failed to create relationship:`, error);
console.error(`[Relationship Service] User: ${userId}, Related: ${relatedId}`);
```

### Performance Metrics

- Relationship creation time
- Database query performance
- Transaction success/failure rates
- Cache hit/miss ratios

## Future Enhancements

### Relationship Metadata

```typescript
// Add relationship context
interface RelationshipMetadata {
  type: "BIOLOGICAL" | "ADOPTIVE" | "STEP" | "FOSTER" | "LEGAL";
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}
```

### Relationship Validation Rules

```typescript
// Configurable validation rules
interface RelationshipRules {
  allowMultipleParents: boolean;
  allowMultipleSpouses: boolean;
  maxParentsPerChild: number;
  requireGenderMatch: boolean;
}
```

### Advanced Queries

```typescript
// Find relationship paths
async findRelationshipPath(memberA: string, memberB: string): Promise<string[]>

// Get family tree depth
async getFamilyTreeDepth(memberId: string): Promise<number>

// Find common ancestors
async findCommonAncestors(memberA: string, memberB: string): Promise<Member[]>
```

## Conclusion

The relationship management system is designed to be flexible, realistic, and user-controlled. By allowing multiple relationships of the same type and avoiding automatic conflict resolution, the system can accurately represent diverse modern family structures while giving users full control over their family data.

Key principles:

- **Bidirectional consistency** ensures data integrity
- **Manual relationship management** respects user autonomy
- **Flexible relationship types** support diverse family structures
- **Comprehensive error handling** prevents data corruption
- **Transaction safety** ensures atomic operations

This approach provides a robust foundation for managing complex family relationships in a real-world application.
