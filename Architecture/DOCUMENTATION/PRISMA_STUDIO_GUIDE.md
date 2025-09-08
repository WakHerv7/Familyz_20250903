# 📊 Prisma Studio Guide

A comprehensive guide to using Prisma Studio for database management and development.

## 🎯 What is Prisma Studio?

Prisma Studio is a powerful **visual database browser and editor** that provides a modern, user-friendly interface for interacting with your database. It's part of the Prisma ecosystem and offers developers an intuitive way to:

- ✅ **View and edit data** in real-time
- ✅ **Execute raw SQL queries**
- ✅ **Manage database relationships**
- ✅ **Inspect schema and constraints**
- ✅ **Export and import data**
- ✅ **Debug database issues**

---

## 🚀 Getting Started

### Prerequisites

Before using Prisma Studio, ensure you have:

- ✅ **Node.js** installed (v14 or higher)
- ✅ **Prisma CLI** installed globally or locally
- ✅ **Database connection** configured in your project
- ✅ **Prisma schema** file (`schema.prisma`)
- ✅ **Database running** and accessible

### Installation

#### Global Installation (Recommended)

```bash
npm install -g prisma
```

#### Local Installation (Project-specific)

```bash
npm install prisma --save-dev
```

### Basic Usage

#### Start Prisma Studio

```bash
# Navigate to your project with Prisma schema
cd your-project

# Start Prisma Studio
npx prisma studio

# Or with custom port
npx prisma studio --port 5556

# Or with browser auto-open disabled
npx prisma studio --browser none
```

#### Access the Interface

Once started, Prisma Studio will:

- Open your default browser automatically
- Display at `http://localhost:5555` (default)
- Show your database schema and data

---

## 🎨 Interface Overview

### Main Components

#### 1. **Schema Sidebar**

- 📋 **Tables/Models**: List of all database tables
- 🔗 **Relationships**: Visual representation of foreign keys
- 📊 **Indexes**: Database indexes and constraints
- 🔍 **Search**: Quick table/model lookup

#### 2. **Data Table View**

- 📝 **Records**: Browse and edit table data
- 🔄 **Pagination**: Navigate through large datasets
- 🔍 **Filters**: Search and filter records
- ➕ **Add Records**: Create new database entries
- ✏️ **Edit Records**: Modify existing data
- 🗑️ **Delete Records**: Remove records with confirmation

#### 3. **SQL Query Editor**

- 💻 **Raw SQL**: Execute custom SQL queries
- 📊 **Query Results**: View query output
- 💾 **Save Queries**: Store frequently used queries
- 📋 **Query History**: Access previous queries

#### 4. **Settings Panel**

- ⚙️ **Connection Settings**: Database connection details
- 🎨 **Theme**: Light/dark mode toggle
- 🔧 **Advanced Options**: Developer settings

---

## 🔧 Key Features

### Data Management

#### Browse and Edit Data

```sql
-- Prisma Studio allows you to:
-- ✓ View all records in any table
-- ✓ Edit individual cell values
-- ✓ Add new records with auto-generated IDs
-- ✓ Delete records with cascade options
-- ✓ Sort and filter data in real-time
```

#### Advanced Filtering

- **Text Search**: Search across all columns
- **Column Filters**: Filter by specific column values
- **Date Filters**: Filter by date ranges
- **Null/Empty Filters**: Find missing data
- **Custom Filters**: Create complex filter combinations

#### Bulk Operations

- **Select Multiple Records**: Multi-select for bulk actions
- **Bulk Edit**: Update multiple records simultaneously
- **Bulk Delete**: Remove multiple records at once
- **Export Selected**: Export specific records to CSV/JSON

### Schema Exploration

#### Table Relationships

```sql
-- Visualize foreign key relationships
-- See one-to-one, one-to-many, many-to-many relationships
-- Navigate between related tables with one click
-- Understand your data model structure
```

#### Index Management

- **View Existing Indexes**: See all database indexes
- **Index Performance**: Analyze index usage
- **Missing Indexes**: Identify potential optimization opportunities
- **Index Creation**: Create new indexes through the UI

#### Constraints and Triggers

- **Primary Keys**: View and manage primary key constraints
- **Foreign Keys**: Manage referential integrity
- **Unique Constraints**: View unique column constraints
- **Check Constraints**: View data validation rules

### SQL Query Interface

#### Query Editor Features

```sql
-- Full SQL syntax highlighting
-- Auto-completion for table/column names
-- Query execution with timing
-- Result formatting and export
-- Query history and bookmarks
```

#### Common Query Patterns

```sql
-- View table structure
DESCRIBE users;

-- Find records with relationships
SELECT u.name, p.title
FROM users u
JOIN posts p ON u.id = p.user_id;

-- Complex aggregations
SELECT
  COUNT(*) as total_users,
  AVG(age) as average_age,
  MAX(created_at) as latest_user
FROM users;
```

---

## 🛠️ Advanced Usage

### Development Workflow

#### 1. **Database Inspection**

```bash
# Start Prisma Studio for development
npx prisma studio --port 5556

# Use this during development to:
# - Inspect data after migrations
# - Debug application issues
# - Verify seed data
# - Test complex queries
```

#### 2. **Data Seeding Verification**

```bash
# After running seed scripts
npm run prisma:seed

# Then verify in Prisma Studio:
# - Check if all expected data was created
# - Verify relationships are correct
# - Test application queries
```

#### 3. **Migration Testing**

```bash
# Before deploying migrations
npx prisma migrate dev

# Use Prisma Studio to:
# - Verify migration results
# - Test new schema changes
# - Ensure data integrity
```

### Production Considerations

#### Security Best Practices

```bash
# Never run Prisma Studio in production
# Use environment-specific configurations
# Limit database user permissions
# Enable SSL connections
```

#### Performance Optimization

- **Use pagination** for large tables
- **Create indexes** on frequently queried columns
- **Monitor query performance** using the SQL editor
- **Regular maintenance** of database statistics

---

## 🔍 Use Cases

### Development Scenarios

#### 1. **API Development**

```typescript
// While building APIs, use Prisma Studio to:
// - Verify data returned by your endpoints
// - Test complex queries before implementing
// - Debug data transformation issues
// - Validate relationship mappings
```

#### 2. **Data Migration**

```sql
-- When migrating data:
// 1. Export data from old system
// 2. Transform data using SQL queries
// 3. Import into new schema
// 4. Verify data integrity
```

#### 3. **Bug Investigation**

```sql
-- When debugging application issues:
// 1. Check actual data in database
// 2. Test queries that might be failing
// 3. Verify foreign key relationships
// 4. Identify data inconsistencies
```

#### 4. **Performance Analysis**

```sql
-- For performance optimization:
// 1. Analyze slow queries
// 2. Check index usage
// 3. Identify missing indexes
// 4. Monitor query execution plans
```

### Content Management

#### 1. **Manual Data Entry**

- Add test data during development
- Create sample content for demos
- Populate lookup tables
- Manage configuration data

#### 2. **Data Cleanup**

- Remove test data
- Fix data inconsistencies
- Update bulk records
- Archive old data

#### 3. **Backup and Recovery**

- Export important data
- Create data snapshots
- Restore from backups
- Migrate data between environments

---

## ⚙️ Configuration Options

### Command Line Options

```bash
# Basic usage
npx prisma studio

# Custom port
npx prisma studio --port 3001

# Custom hostname
npx prisma studio --hostname 0.0.0.0

# Disable browser auto-open
npx prisma studio --browser none

# Use specific schema file
npx prisma studio --schema ./custom/schema.prisma

# Enable experimental features
npx prisma studio --experimental
```

### Environment Variables

```bash
# Database connection
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Prisma configuration
PRISMA_STUDIO_PORT=5555
PRISMA_STUDIO_HOSTNAME=localhost
PRISMA_STUDIO_BROWSER=chrome
```

### Schema Configuration

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Your models here...
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Connection Failed**

```bash
# Check database is running
sudo systemctl status postgresql

# Test connection manually
psql -U your_user -d your_database

# Verify DATABASE_URL
echo $DATABASE_URL
```

#### 2. **Port Already in Use**

```bash
# Find process using port
lsof -i :5555

# Kill process
kill -9 <PID>

# Or use different port
npx prisma studio --port 5556
```

#### 3. **Permission Denied**

```bash
# Grant database permissions
psql -U postgres -c "GRANT ALL ON DATABASE your_db TO your_user;"

# For PostgreSQL superuser access
psql -U postgres -c "ALTER USER your_user CREATEDB;"
```

#### 4. **Browser Won't Open**

```bash
# Disable auto-open and manually navigate
npx prisma studio --browser none

# Then open: http://localhost:5555
```

#### 5. **Schema Not Found**

```bash
# Ensure you're in the correct directory
pwd

# Check if schema.prisma exists
ls -la prisma/schema.prisma

# Generate Prisma client
npx prisma generate
```

### Performance Issues

#### Large Datasets

```sql
-- Use LIMIT for large tables
SELECT * FROM large_table LIMIT 100;

-- Create indexes for better performance
CREATE INDEX idx_name ON table_name(column_name);
```

#### Slow Queries

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Add appropriate indexes
CREATE INDEX idx_users_email ON users(email);
```

---

## 🎨 Customization

### Themes and Appearance

#### Dark Mode

```typescript
// Prisma Studio automatically detects system theme
// Or manually toggle in settings
```

#### Custom Styling

```css
/* Prisma Studio uses modern CSS
/* You can customize appearance through browser dev tools
/* Changes are saved in localStorage
```

### Keyboard Shortcuts

| Shortcut           | Action             |
| ------------------ | ------------------ |
| `Ctrl/Cmd + F`     | Search             |
| `Ctrl/Cmd + Enter` | Execute Query      |
| `Ctrl/Cmd + S`     | Save Query         |
| `Ctrl/Cmd + R`     | Refresh Data       |
| `Esc`              | Close Modal/Dialog |

---

## 🔗 Integration with Development Workflow

### Development Pipeline

```mermaid
graph TD
    A[Code Changes] --> B[Run Migrations]
    B --> C[Start Prisma Studio]
    C --> D[Verify Data]
    D --> E[Test Application]
    E --> F[Deploy to Production]
```

### Best Practices

#### 1. **Version Control**

```bash
# Include Prisma Studio in development scripts
# Document database changes
# Share query bookmarks with team
```

#### 2. **Team Collaboration**

```bash
# Use consistent port numbers
# Share query snippets
# Document complex data operations
```

#### 3. **Security**

```bash
# Never expose Prisma Studio publicly
# Use strong database passwords
# Limit database user permissions
```

---

## 📚 Resources

### Official Documentation

- [Prisma Studio Documentation](https://www.prisma.io/docs/concepts/components/prisma-studio)
- [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [Database Connection Guides](https://www.prisma.io/docs/reference/database-reference)

### Community Resources

- [Prisma Discord](https://discord.gg/prisma)
- [GitHub Issues](https://github.com/prisma/prisma/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/prisma)

### Related Tools

- **Prisma Client**: Type-safe database access
- **Prisma Migrate**: Database schema migrations
- **Prisma Generate**: Code generation tools

---

## 🎯 Quick Start Checklist

- [ ] Install Prisma CLI
- [ ] Configure database connection
- [ ] Create/update schema.prisma
- [ ] Run database migrations
- [ ] Start Prisma Studio
- [ ] Explore your data
- [ ] Test queries and relationships
- [ ] Verify application integration

---

## 💡 Pro Tips

### Efficiency Tips

1. **Use bookmarks** for frequently used queries
2. **Leverage filters** to find data quickly
3. **Export data** for backup and analysis
4. **Monitor performance** of your queries

### Development Tips

1. **Keep Prisma Studio open** during development
2. **Use it for debugging** database-related issues
3. **Test complex queries** before implementing in code
4. **Verify data integrity** after migrations

### Production Tips

1. **Never run in production** environments
2. **Use read-only connections** when possible
3. **Monitor database performance** regularly
4. **Keep backups** of important data

---

_Last updated: September 7, 2025_
_Prisma Studio Version: Latest_
