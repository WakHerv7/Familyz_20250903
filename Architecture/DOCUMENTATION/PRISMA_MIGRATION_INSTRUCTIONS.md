# 📋 Prisma Migration Setup Instructions

This document provides comprehensive instructions for setting up and running Prisma migrations for the soft delete functionality implemented in the Family Tree application.

## 🎯 Overview

The soft delete functionality requires adding a `deletedAt` field to the Family model in the database. This guide covers multiple approaches to ensure successful migration execution.

---

## 📋 Prerequisites

Before running migrations, ensure you have:

- ✅ PostgreSQL database running
- ✅ Database user with proper permissions
- ✅ Prisma CLI installed (`npm install -g prisma`)
- ✅ Valid `.env` file with `DATABASE_URL`

---

## 🔧 Option 1: Standard Prisma Migration (Recommended)

### Step 1: Navigate to Backend Directory

```bash
cd family-tree-backend
```

### Step 2: Check Database Connection

First, ensure your database is running and accessible:

```bash
# Check if PostgreSQL is running (Linux/Mac)
sudo systemctl status postgresql

# Or check if Docker container is running
docker ps | grep postgres
```

### Step 3: Verify Database Permissions

Make sure your database user has the necessary permissions:

```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Grant permissions to your database user
GRANT ALL PRIVILEGES ON DATABASE familyz_db TO your_db_user;
ALTER USER your_db_user CREATEDB;
```

### Step 4: Run the Migration

```bash
# Generate the migration for the deletedAt field
npx prisma migrate dev --name add-soft-delete-to-family

# When prompted, enter a name for the migration
# Suggested name: "add-soft-delete-to-family"
```

### Step 5: Verify Migration Success

```bash
# Check migration files
ls prisma/migrations/

# Verify database schema
npx prisma db push --preview-feature
```

---

## 🔧 Option 2: Manual Database Update (If Migration Fails)

### Step 1: Connect to Database

```bash
# Connect to your PostgreSQL database
psql -U your_username -d familyz_db
```

### Step 2: Add deletedAt Column Manually

```sql
-- Add the deletedAt column to the families table
ALTER TABLE "families" ADD COLUMN "deleted_at" TIMESTAMP;

-- Create an index for better performance
CREATE INDEX "families_deleted_at_idx" ON "families"("deleted_at");

-- Optional: Add a partial index for non-deleted records
CREATE INDEX "families_active_idx" ON "families"("id") WHERE "deleted_at" IS NULL;
```

### Step 3: Update Prisma Client

```bash
# Regenerate Prisma client with the new schema
npx prisma generate
```

---

## 🔧 Option 3: Using Docker (If Using Docker)

### Step 1: Check Docker Setup

```bash
# Check if PostgreSQL container is running
docker ps

# If not running, start it
docker start your_postgres_container

# Or create a new one with proper permissions
docker run --name postgres-familyz \
  -e POSTGRES_DB=familyz_db \
  -e POSTGRES_USER=your_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:13
```

### Step 2: Grant Superuser Permissions

```bash
# Connect to the container
docker exec -it your_postgres_container psql -U your_user -d familyz_db

# Inside PostgreSQL, grant permissions
ALTER USER your_user CREATEDB;
```

### Step 3: Run Migration

```bash
cd family-tree-backend
npx prisma migrate dev --name add-soft-delete-to-family
```

---

## 🔧 Option 4: Environment Configuration

### Step 1: Check .env File

Ensure your `.env` file has the correct database URL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/familyz_db?schema=public"
```

### Step 2: Test Connection

```bash
# Test database connection
npx prisma db push --preview-feature
```

---

## 🔧 Option 5: Reset and Recreate (Last Resort)

### Step 1: Reset Database

```bash
# This will reset your database and apply all migrations from scratch
npx prisma migrate reset --force
```

### Step 2: Re-seed Database (If Needed)

```bash
# If you have seed data
npx prisma db seed
```

---

## ✅ Verification Steps

### Step 1: Check Migration Files

```bash
# List migration files
ls -la prisma/migrations/

# Should see a new migration file like:
# 20250907123200_add_soft_delete_to_family/
```

### Step 2: Verify Database Schema

```bash
# Check if the column was added
npx prisma db push --preview-feature

# Or connect to database and check
psql -U your_user -d familyz_db -c "\d families"
```

### Step 3: Test the Application

```bash
# Start the backend
cd family-tree-backend
npm run start:dev

# Start the frontend
cd family-tree-frontend
npm run dev
```

---

## 🔍 Troubleshooting

### Common Issues:

#### 1. Permission Denied

```bash
# Solution: Grant database permissions
psql -U postgres -c "ALTER USER your_user CREATEDB;"
```

#### 2. Shadow Database Error

```bash
# Solution: Use --create-db flag or manual setup
npx prisma migrate dev --create-db
```

#### 3. Connection Issues

```bash
# Test connection
npx prisma db push --preview-feature

# Check DATABASE_URL
echo $DATABASE_URL
```

#### 4. Migration Already Exists

```bash
# If migration already exists, reset and try again
npx prisma migrate reset --force
```

---

## 📊 What the Migration Does

The migration will:

- ✅ Add `deleted_at` column to `families` table
- ✅ Create indexes for performance
- ✅ Update Prisma client types
- ✅ Enable soft delete functionality

---

## 🎯 After Migration Success

Once the migration runs successfully:

- ✅ The `deletedAt` field will be available in your Family model
- ✅ Soft delete endpoints will work (`DELETE /families/:id`)
- ✅ Restore endpoints will work (`POST /families/:id/restore`)
- ✅ Frontend delete functionality will be fully operational

---

## 🧪 Quick Test

After migration, you can test the soft delete functionality by:

1. Creating a family
2. Clicking the dropdown menu (⋯) on the family card
3. Selecting "Delete Family"
4. Confirming the deletion
5. The family should disappear from the list

---

## 📝 Schema Changes Summary

### Database Changes:

```sql
-- New column added to families table
ALTER TABLE "families" ADD COLUMN "deleted_at" TIMESTAMP;

-- New indexes for performance
CREATE INDEX "families_deleted_at_idx" ON "families"("deleted_at");
CREATE INDEX "families_active_idx" ON "families"("id") WHERE "deleted_at" IS NULL;
```

### Prisma Schema Changes:

```prisma
model Family {
  // ... existing fields
  deletedAt   DateTime? @map("deleted_at") // Soft delete support
  // ... rest of fields
}
```

### API Changes:

- `DELETE /families/:id` - Soft delete family
- `POST /families/:id/restore` - Restore soft deleted family
- `DELETE /families/:id/hard` - Hard delete (legacy)

---

## 🚀 Next Steps

After successful migration:

1. Test the soft delete functionality in the UI
2. Verify that deleted families are properly hidden
3. Test the restore functionality (if implemented)
4. Update any existing queries to handle soft deletes appropriately

---

## 📞 Support

If you encounter issues:

1. Check the Prisma documentation: https://www.prisma.io/docs
2. Verify database permissions
3. Ensure DATABASE_URL is correct
4. Check PostgreSQL logs for detailed error messages

---

_Last updated: September 7, 2025_
_Migration: add-soft-delete-to-family_
