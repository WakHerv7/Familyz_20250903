# 🔷 Prisma Complete Guide

A comprehensive guide to Prisma ecosystem, features, and best practices for modern database development.

## 📋 Table of Contents

- [🎯 What is Prisma?](#-what-is-prisma)
- [🌱 Prisma Seed](#-prisma-seed)
- [📊 Prisma Client](#-prisma-client)
- [🚀 Prisma Migrate](#-prisma-migrate)
- [⚡ Prisma Generate](#-prisma-generate)
- [🎨 Prisma Studio](#-prisma-studio)
- [🔍 Prisma DB Commands](#-prisma-db-commands)
- [📝 Schema Management](#-schema-management)
- [🔒 Type Safety & Validation](#-type-safety--validation)
- [🛠️ Advanced Features](#️-advanced-features)
- [📚 Best Practices](#-best-practices)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🎯 What is Prisma?

Prisma is a **next-generation ORM** (Object-Relational Mapping) that provides:

- ✅ **Type-safe database access** with auto-generated TypeScript types
- ✅ **Intuitive data modeling** with declarative schema syntax
- ✅ **Powerful migration system** for schema evolution
- ✅ **Visual database browser** (Prisma Studio)
- ✅ **Database-agnostic** support (PostgreSQL, MySQL, SQLite, SQL Server, MongoDB)
- ✅ **Real-time data synchronization** capabilities

### Core Components

```mermaid
graph TD
    A[Prisma Schema] --> B[Prisma Client]
    A --> C[Prisma Migrate]
    A --> D[Prisma Studio]
    B --> E[Type-safe Queries]
    C --> F[Database Schema]
    D --> G[Visual Interface]
```

---

## 🌱 Prisma Seed

Prisma Seed allows you to populate your database with initial/test data using TypeScript/JavaScript.

### Setting Up Seed

#### 1. Create Seed File

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Your seed logic here
  await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: await bcrypt.hash("password123", 10),
    },
  });

  console.log("✅ Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 2. Configure Package.json

```json
{
  "scripts": {
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

#### 3. Configure Prisma Schema

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Optional: Configure seed
generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Running Seed

```bash
# Run seed script
npm run prisma:seed

# Or directly with ts-node
npx ts-node prisma/seed.ts

# Or with npx prisma db seed (if configured)
npx prisma db seed
```

### Advanced Seed Patterns

#### Conditional Seeding

```typescript
async function main() {
  // Only seed in development
  if (process.env.NODE_ENV === "development") {
    console.log("🧹 Cleaning existing data...");
    await prisma.user.deleteMany();
  }

  // Check if data already exists
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("📝 Seeding initial data...");
    // Seed logic here
  }
}
```

#### Relationship Seeding

```typescript
async function main() {
  // Create user with posts
  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      name: "John Doe",
      posts: {
        create: [
          {
            title: "My First Post",
            content: "This is my first blog post!",
            published: true,
          },
          {
            title: "My Second Post",
            content: "This is my second blog post!",
            published: false,
          },
        ],
      },
    },
  });
}
```

#### Bulk Seeding

```typescript
async function main() {
  const users = [
    { email: "user1@example.com", name: "User 1" },
    { email: "user2@example.com", name: "User 2" },
    { email: "user3@example.com", name: "User 3" },
  ];

  // Bulk create
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true, // Skip if email already exists
  });
}
```

### Seed Best Practices

#### 1. **Environment Awareness**

```typescript
// Only seed in development
if (process.env.NODE_ENV !== "production") {
  // Seed logic
}
```

#### 2. **Idempotent Operations**

```typescript
// Use upsert for safe updates
await prisma.user.upsert({
  where: { email: "admin@example.com" },
  update: { name: "Updated Admin" },
  create: {
    email: "admin@example.com",
    name: "Admin User",
    password: hashedPassword,
  },
});
```

#### 3. **Error Handling**

```typescript
try {
  await prisma.user.create({ data: userData });
} catch (error) {
  if (error.code === "P2002") {
    console.log("User already exists, skipping...");
  } else {
    throw error;
  }
}
```

#### 4. **Performance Optimization**

```typescript
// Use transactions for related data
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.post.create({
    data: {
      title: "Welcome Post",
      authorId: user.id,
    },
  });
});
```

---

## 📊 Prisma Client

Prisma Client is the auto-generated query builder that provides type-safe database access.

### Basic Usage

#### Setup

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // Enable logging
});
```

#### CRUD Operations

```typescript
// CREATE
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// READ
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: "@example.com",
    },
  },
  take: 10,
  orderBy: {
    createdAt: "desc",
  },
});

// UPDATE
const updatedUser = await prisma.user.update({
  where: { id: "user-id" },
  data: {
    name: "Jane Doe",
    email: "jane@example.com",
  },
});

// DELETE
await prisma.user.delete({
  where: { id: "user-id" },
});
```

### Advanced Queries

#### Filtering

```typescript
// Complex filters
const users = await prisma.user.findMany({
  where: {
    AND: [{ age: { gte: 18 } }, { age: { lte: 65 } }],
    OR: [
      { name: { contains: "John" } },
      { email: { endsWith: "@company.com" } },
    ],
    NOT: {
      status: "INACTIVE",
    },
  },
});
```

#### Relations

```typescript
// Include related data
const userWithPosts = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    },
    profile: true,
  },
});

// Nested creates
const userWithProfile = await prisma.user.create({
  data: {
    email: "user@example.com",
    profile: {
      create: {
        bio: "Software developer",
        avatar: "avatar.jpg",
      },
    },
  },
  include: {
    profile: true,
  },
});
```

#### Aggregations

```typescript
// Count
const userCount = await prisma.user.count({
  where: { status: "ACTIVE" },
});

// Aggregate
const userStats = await prisma.user.aggregate({
  _count: { id: true },
  _avg: { age: true },
  _min: { age: true },
  _max: { age: true },
  where: { status: "ACTIVE" },
});

// Group by
const postsByCategory = await prisma.post.groupBy({
  by: ["category"],
  _count: { id: true },
  orderBy: { _count: { id: "desc" } },
});
```

### Transactions

```typescript
// Single transaction
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.post.create({
    data: {
      title: "Welcome!",
      authorId: user.id,
    },
  });
});

// Interactive transactions
await prisma.$transaction(async (tx) => {
  // Complex business logic
  const result = await tx.user.findUnique({
    where: { id: userId },
  });

  if (result.balance < amount) {
    throw new Error("Insufficient balance");
  }

  await tx.user.update({
    where: { id: userId },
    data: { balance: { decrement: amount } },
  });

  await tx.user.update({
    where: { id: recipientId },
    data: { balance: { increment: amount } },
  });
});
```

### Raw SQL Queries

```typescript
// Raw query
const users = await prisma.$queryRaw`
  SELECT * FROM users
  WHERE created_at > ${new Date("2023-01-01")}
  ORDER BY created_at DESC
`;

// Raw execute
await prisma.$executeRaw`
  UPDATE users
  SET last_login = ${new Date()}
  WHERE id = ${userId}
`;
```

---

## 🚀 Prisma Migrate

Prisma Migrate manages database schema changes and migrations.

### Basic Migration

```bash
# Create migration
npx prisma migrate dev --name add-user-table

# Apply migrations
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset
```

### Migration Files

```sql
-- prisma/migrations/20230907120000_add_user_table/migration.sql
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

### Migration Commands

```bash
# Development workflow
npx prisma migrate dev          # Create and apply migration
npx prisma migrate dev --create-only  # Create migration file only

# Production deployment
npx prisma migrate deploy       # Apply pending migrations
npx prisma migrate resolve --applied 20230907120000  # Mark as applied

# Database management
npx prisma migrate reset        # Reset database and reapply all migrations
npx prisma migrate status       # Check migration status

# Advanced options
npx prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --script
```

---

## ⚡ Prisma Generate

Generates Prisma Client and other artifacts from your schema.

### Basic Generation

```bash
# Generate Prisma Client
npx prisma generate

# Generate with custom output
npx prisma generate --schema=./custom/schema.prisma
```

### Custom Generators

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}

generator dbml {
  provider = "prisma-dbml-generator"
  output   = "./generated/dbml"
}

generator erd {
  provider = "prisma-erd-generator"
  output   = "./generated/erd"
  theme    = "forest"
}
```

### Generator Configuration

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "./generated/client"
  binaryTargets = ["native", "debian-openssl-1.1.x"]
  engineType    = "library" // or "binary"
  previewFeatures = ["postgresqlExtensions", "metrics"]
}
```

---

## 🎨 Prisma Studio

Visual database browser and editor (covered in separate guide).

---

## 🔍 Prisma DB Commands

Database management and introspection commands.

### Database Introspection

```bash
# Generate schema from existing database
npx prisma db pull

# Push schema changes to database
npx prisma db push

# Execute SQL files
npx prisma db execute --file ./scripts/setup.sql

# Seed database
npx prisma db seed
```

### Database Commands

```bash
# View database URL
npx prisma db --help

# Check database connection
npx prisma db push --preview-feature

# Create database (if supported)
npx prisma db push --accept-data-loss
```

---

## 📝 Schema Management

### Schema Structure

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  age       Int?
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String

  author    User     @relation(fields: [authorId], references: [id])
  tags      Tag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Advanced Schema Features

#### Relations

```prisma
model User {
  id       String @id @default(cuid())
  posts    Post[]
  profile  Profile?
}

model Post {
  id       String  @id @default(cuid())
  authorId String
  author   User    @relation(fields: [authorId], references: [id])
}

model Profile {
  id     String  @id @default(cuid())
  userId String  @unique
  user   User    @relation(fields: [userId], references: [id])
}
```

#### Enums and Constraints

```prisma
enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Post {
  id        String   @id @default(cuid())
  title     String   @db.VarChar(255)
  content   String?
  status    Status   @default(DRAFT)
  published Boolean  @default(false)

  @@unique([title, status])
  @@index([status, published])
}
```

#### Database-specific Features

```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  metadata Json?  // PostgreSQL JSONB

  // PostgreSQL extensions
  location Point? @db.PostGIS.Geometry(Point, 4326)

  @@index([email])
  @@fulltext([email]) // PostgreSQL full-text search
}
```

---

## 🔒 Type Safety & Validation

### Auto-generated Types

```typescript
// Generated types from schema
type User = {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

// Type-safe queries
const user = await prisma.user.findUnique({
  where: { id: "123" }, // Type-checked
  select: {
    id: true,
    email: true,
    name: true,
  },
});
// Type: { id: string; email: string; name: string | null; }
```

### Validation with Zod

```typescript
import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  age: z.number().min(0).max(150).optional(),
});

const CreateUserSchema = UserSchema.omit({ id: true });

export async function createUser(data: z.infer<typeof CreateUserSchema>) {
  const validatedData = CreateUserSchema.parse(data);
  return prisma.user.create({ data: validatedData });
}
```

### Middleware for Validation

```typescript
// Validation middleware
prisma.$use(async (params, next) => {
  if (params.model === "User" && params.action === "create") {
    const { email } = params.args.data;
    if (!email.includes("@")) {
      throw new Error("Invalid email format");
    }
  }
  return next(params);
});

// Logging middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const end = Date.now();
  console.log(`${params.model}.${params.action} took ${end - start}ms`);
  return result;
});
```

---

## 🛠️ Advanced Features

### Connection Management

```typescript
// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection monitoring
prisma.$on("beforeExit", async () => {
  console.log("Prisma client is shutting down...");
});

// Health checks
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy" };
  } catch (error) {
    return { status: "unhealthy", error: error.message };
  }
}
```

### Performance Optimization

#### Query Optimization

```typescript
// Efficient queries
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // Only select needed fields
  },
  where: {
    createdAt: {
      gte: new Date("2023-01-01"),
    },
  },
});

// Use indexes effectively
await prisma.user.findMany({
  where: {
    email: "user@example.com", // Uses email index
    status: "ACTIVE", // Uses status index
  },
});
```

#### Caching Strategies

```typescript
// Application-level caching
import { LRUCache } from "lru-cache";

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function getUserWithCache(id: string) {
  const cacheKey = `user:${id}`;
  let user = cache.get(cacheKey);

  if (!user) {
    user = await prisma.user.findUnique({
      where: { id },
      include: { posts: true },
    });
    cache.set(cacheKey, user);
  }

  return user;
}
```

### Error Handling

```typescript
// Comprehensive error handling
try {
  const user = await prisma.user.create({ data: userData });
  return user;
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Known Prisma errors
    switch (error.code) {
      case "P2002":
        throw new Error("Email already exists");
      case "P2025":
        throw new Error("Record not found");
      default:
        throw new Error(`Database error: ${error.message}`);
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error("Invalid data provided");
  } else {
    throw new Error("Unknown database error");
  }
}
```

---

## 📚 Best Practices

### Schema Design

#### 1. **Use Descriptive Names**

```prisma
// ✅ Good
model User {
  id          String @id @default(cuid())
  email       String @unique
  firstName   String
  lastName    String
  dateOfBirth DateTime?
}

// ❌ Avoid
model U {
  i  String @id @default(cuid())
  e  String @unique
  fn String
  ln String
  dob DateTime?
}
```

#### 2. **Consistent Naming Conventions**

```prisma
// Use PascalCase for models
model UserProfile { ... }
model BlogPost { ... }

// Use camelCase for fields
model User {
  firstName   String
  lastName    String
  dateOfBirth DateTime?
  isActive    Boolean @default(true)
}
```

#### 3. **Proper Indexing**

```prisma
model User {
  id        String @id @default(cuid())
  email     String @unique
  username  String @unique
  status    Status

  @@index([status, createdAt])
  @@index([email])
}
```

### Query Optimization

#### 1. **Select Only Needed Fields**

```typescript
// ✅ Efficient
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});

// ❌ Inefficient
const users = await prisma.user.findMany(); // Selects all fields
```

#### 2. **Use Appropriate Filters**

```typescript
// ✅ Uses indexes
const activeUsers = await prisma.user.findMany({
  where: { status: "ACTIVE" },
});

// ✅ Efficient pagination
const users = await prisma.user.findMany({
  take: 20,
  skip: 0,
  orderBy: { createdAt: "desc" },
});
```

#### 3. **Batch Operations**

```typescript
// ✅ Batch create
await prisma.user.createMany({
  data: userArray,
});

// ✅ Batch update
await prisma.user.updateMany({
  where: { status: "INACTIVE" },
  data: { lastLogin: new Date() },
});
```

### Security Best Practices

#### 1. **Input Validation**

```typescript
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
});

export async function createUser(input: unknown) {
  const data = CreateUserSchema.parse(input);
  return prisma.user.create({ data });
}
```

#### 2. **SQL Injection Prevention**

```typescript
// ✅ Safe - Prisma handles parameterization
const users = await prisma.user.findMany({
  where: {
    email: userInput, // Automatically parameterized
  },
});

// ❌ Dangerous - Raw SQL without parameters
const users = await prisma.$queryRaw(
  `SELECT * FROM users WHERE email = '${userInput}'`
);
```

#### 3. **Connection Security**

```typescript
// Use SSL connections
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Should include SSL parameters
    },
  },
});
```

### Environment Management

#### 1. **Environment Variables**

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/db?sslmode=require"
NODE_ENV="development"
PRISMA_LOG_LEVEL="query"
```

#### 2. **Multiple Environments**

```typescript
// Different configurations for different environments
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Connection Issues**

```bash
# Check database status
sudo systemctl status postgresql

# Test connection
psql -U username -d database

# Verify DATABASE_URL
echo $DATABASE_URL
```

#### 2. **Migration Problems**

```bash
# Reset migrations (development only)
npx prisma migrate reset --force

# Resolve migration conflicts
npx prisma migrate resolve --applied migration_name

# Check migration status
npx prisma migrate status
```

#### 3. **Type Generation Issues**

```bash
# Regenerate client
npx prisma generate

# Clear cache
rm -rf node_modules/.prisma
npx prisma generate
```

#### 4. **Performance Issues**

```bash
# Enable query logging
const prisma = new PrismaClient({
  log: ['query'],
});

// Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Error Codes

| Error Code | Description                 | Solution                                 |
| ---------- | --------------------------- | ---------------------------------------- |
| P1001      | Database server unreachable | Check database connection                |
| P1008      | Operations timed out        | Increase timeout or check network        |
| P2002      | Unique constraint violation | Handle duplicate entries                 |
| P2025      | Record not found            | Check if record exists before operations |
| P2028      | Transaction API error       | Check transaction syntax                 |

### Debugging Tools

#### 1. **Query Logging**

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: "stdout", level: "query" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
    { emit: "stdout", level: "error" },
  ],
});
```

#### 2. **Performance Monitoring**

```typescript
// Middleware for performance tracking
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    // Log slow queries
    console.log(`Slow query: ${params.model}.${params.action} (${duration}ms)`);
  }

  return result;
});
```

---

## 📚 Resources

### Official Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Migration Guides](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)

### Community Resources

- [Prisma Discord](https://discord.gg/prisma)
- [GitHub Repository](https://github.com/prisma/prisma)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/prisma)

### Learning Resources

- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [Prisma Blog](https://www.prisma.io/blog)
- [YouTube Tutorials](https://www.youtube.com/c/PrismaData)

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Development
npx prisma generate          # Generate Prisma Client
npx prisma db push          # Push schema changes
npx prisma studio           # Open visual editor
npx prisma seed             # Run seed script

# Production
npx prisma migrate deploy   # Apply migrations
npx prisma db push          # Update schema

# Utilities
npx prisma format           # Format schema
npx prisma validate         # Validate schema
npx prisma --help           # Show all commands
```

### Common Patterns

```typescript
// Repository pattern
class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserInput) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

// Service pattern
class UserService {
  constructor(private repository: UserRepository) {}

  async createUser(input: CreateUserInput) {
    // Business logic
    const user = await this.repository.create(input);
    // Send welcome email, etc.
    return user;
  }
}
```

---

_Last updated: September 7, 2025_
_Prisma Version: Latest_
