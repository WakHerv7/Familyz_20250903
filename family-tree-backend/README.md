# Family Tree Platform - Backend

A comprehensive family tree management platform built with NestJS, Prisma, and PostgreSQL. This backend provides APIs for hierarchical family management, member relationships, invitation systems, and tree visualization.

## 🌳 Features

### 🔐 **Dual Registration System**

- **Create New Family**: Users can start their own family tree
- **Join Existing Family**: Users can join families via invitation codes

### 👥 **Complex Family Relationships**

- Parent-child relationships (many-to-many)
- Spouse relationships (many-to-many)
- Multi-generational family trees
- Gender and status tracking

### 🏠 **Hierarchical Family Structure**

- Main families and sub-families
- Automatic membership based on relationships
- Manual opt-in/opt-out for sub-families
- Role-based family management (Admin, Member, Head, Viewer)

### 💌 **JWT-Based Invitation System**

- Secure invitation codes with expiration
- Profile stubs for invited members
- Invitation status tracking
- Email/sharing integration ready

### 🔒 **Advanced Security**

- JWT authentication with refresh tokens
- Role-based access control
- Privacy filtering by family membership
- Rate limiting and validation

### 📊 **Member Profiles**

- Flexible personal information (JSON storage)
- Profile pictures and social links
- Occupation and biographical data
- Contact information management

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (local installation)
- npm or yarn package manager

### Current Setup Status ✅

This project is now configured for **local development** with:

- ✅ Local PostgreSQL database (`familyz_db`)
- ✅ Local file uploads (`./uploads` directory)
- ✅ Sample data seeded
- ✅ All migrations applied
- ✅ API server tested and working

### Installation

```bash
# Clone the repository
cd family-tree-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secrets
```

### Database Setup

#### Local PostgreSQL Setup

First, ensure you have PostgreSQL installed and running locally. Then create the database:

```bash
# Create database user (run as postgres superuser)
sudo -u postgres psql
CREATE USER admin WITH PASSWORD 'mySecureFamily!123';
CREATE DATABASE familyz_db OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE familyz_db TO admin;
\q

# Alternative: Use your preferred database name and credentials
# Just update the DATABASE_URL in .env accordingly
```

#### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed with sample data
npm run prisma:seed
```

### Development

```bash
# Start development server
npm run start:dev

# The API will be available at http://localhost:3001
# Documentation at http://localhost:3001/docs
```

## 📋 Environment Configuration

The project is configured to use local PostgreSQL. Current environment variables:

```env
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://admin:mySecureFamily!123@localhost:5432/familyz_db?schema=public"

# JWT Configuration
JWT_SECRET="family-tree-platform-super-secret-jwt-key-2024"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Invitation JWT (separate secret)
INVITATION_JWT_SECRET="family-tree-invitation-secret-key-2024"
INVITATION_EXPIRES_IN="7d"

# App Configuration
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# App URL (for file upload URLs)
APP_URL="http://localhost:3001"

# File Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_DEST="./uploads"
```

**Note:** The database is now configured for local PostgreSQL. If you want to use different credentials, update the `DATABASE_URL` in the `.env` file.

## 🏗️ Database Schema

### Core Entities

- **User**: Authentication (email/phone, password)
- **Member**: Family tree nodes (personal info, relationships)
- **Family**: Family groups (main families and sub-families)
- **FamilyMembership**: Member-family relationships with roles
- **Invitation**: JWT-based invitation system

### Relationships

```
User (1:1) Member (M:M) FamilyMembership (M:1) Family
Member (M:M) Member (parents/spouses/children)
Family (1:M) Family (parent/sub-family hierarchy)
```

## 🔌 API Endpoints

### Authentication

```bash
POST /api/v1/auth/register   # Register (create family or join via invitation)
POST /api/v1/auth/login      # Login with email/phone
POST /api/v1/auth/refresh    # Refresh access token
```

### Family Management _(Coming Soon)_

```bash
GET  /api/v1/families        # List user's families
POST /api/v1/families        # Create sub-family
GET  /api/v1/families/:id    # Get family details
PUT  /api/v1/families/:id    # Update family info
```

### Member Management _(Coming Soon)_

```bash
GET  /api/v1/members/profile # Get own profile
PUT  /api/v1/members/profile # Update own profile
GET  /api/v1/members/:id     # Get member details (if permitted)
POST /api/v1/members/relationships # Add/update relationships
```

### Invitations _(Coming Soon)_

```bash
POST /api/v1/invitations     # Create invitation
GET  /api/v1/invitations     # List sent invitations
POST /api/v1/invitations/validate # Validate invitation code
```

### Tree Visualization _(Coming Soon)_

```bash
GET  /api/v1/tree/family/:id # Get family tree data
GET  /api/v1/tree/member/:id # Get member's relationships
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov

# API functionality test
npm run test:api
```

### Sample API Test

```bash
# Make sure the server is running
npm run start:dev

# In another terminal
npm run test:api
```

## 📊 Sample Data

The seed script creates a comprehensive multi-generational family structure with 40 members:

```
William Smith (♂) ⚭ Elizabeth Smith (♀) [Great-Grandparents]
└── James Smith (♂) ⚭ Patricia Smith (♀) [Grandparents]
    └── David Smith (♂) ⚭ Sarah Smith (♀) [Parents]
        ├── Alex Smith (♂) ⚭ Jamie Smith (♀) [Main User - Family Admin]
        │   ├── Ryan Smith (♂) ⚭ Casey Smith (♀)
        │   │   ├── Ethan Smith (♂) & Olivia Smith (♀) [Grandchildren]
        │   ├── Taylor Smith (♀) ⚭ Morgan Smith (♂)
        │   │   ├── Noah Smith (♂) & Ava Smith (♀) [Grandchildren]
        │   └── Jordan Smith (♂)
        ├── Michael Smith (♂) [Brother]
        └── Emily Smith (♀) [Sister]
    ├── Robert Smith (♂) ⚭ Linda Smith (♀) [Uncle/Aunt]
    │   └── Kevin Smith (♂) & Rachel Smith (♀) [Cousins]
    └── Christopher Smith (♂) ⚭ Jennifer Smith (♀) [Uncle/Aunt]
        └── Brian Smith (♂) & Laura Smith (♀) [Cousins]

Robert Johnson (♂) ⚭ Mary Johnson (♀) [Great-Grandparents]
└── Thomas Johnson (♂) ⚭ Catherine Johnson (♀) [Grandparents]
    └── Sarah Smith (♀) [Mother]
        ├── Daniel Johnson (♂) ⚭ Maria Johnson (♀) [Uncle/Aunt]
        │   └── Steven Johnson (♂) & Lisa Johnson (♀) [Cousins]
        └── Peter Johnson (♂) ⚭ Anna Johnson (♀) [Uncle/Aunt]
            └── Mark Johnson (♂) & Sophia Johnson (♀) [Cousins]
```

**Family Statistics:**

- **4 Generations**: Great-grandparents, grandparents, parents, children
- **40 Total Members**: Including spouses, siblings, cousins, uncles, aunts
- **2 Main Family Lines**: Smith and Johnson families merged through marriage
- **1 Sub-family**: Alex's immediate family branch
- **Multiple Relationship Types**: Parents, children, spouses, siblings, cousins

**Demo Credentials:**

- Email: `alex.smith@example.com` (Main User - Family Admin)
- Email: `david.smith@example.com` (Father - Family Head)
- Password: `FamilyTree123!`

## 🎯 Registration Examples

### Create New Family

```json
POST /api/v1/auth/register
{
  "registrationType": "create_family",
  "email": "founder@family.com",
  "password": "SecurePass123!",
  "name": "Family Founder",
  "gender": "MALE",
  "personalInfo": {
    "bio": "Starting our family tree",
    "birthDate": "1980-01-01",
    "occupation": "Engineer"
  },
  "familyName": "The Johnson Family",
  "familyDescription": "Our growing family tree"
}
```

### Join Existing Family

```json
POST /api/v1/auth/register
{
  "registrationType": "join_family",
  "email": "newmember@family.com",
  "password": "SecurePass123!",
  "name": "New Member",
  "gender": "FEMALE",
  "personalInfo": {
    "bio": "Excited to join the family",
    "birthDate": "1985-05-15",
    "occupation": "Teacher"
  },
  "invitationCode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Invitation Validation**: JWT-based invitations with expiration
- **Privacy Filtering**: Users only see permitted family members
- **Role-Based Access**: Family admins, members, heads, and viewers
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation

## 🏗️ Architecture

```
├── src/
│   ├── auth/          # Authentication & JWT
│   ├── user/          # User account management
│   ├── member/        # Family member profiles
│   ├── family/        # Family and sub-family management
│   ├── invitation/    # Invitation system
│   ├── tree/          # Tree visualization APIs
│   ├── common/        # Shared utilities
│   └── prisma/        # Database service
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── seed.ts        # Sample data
└── test/              # Test files
```

## 🚀 Deployment

### Environment Setup

```bash
# Production environment
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="strong-production-jwt-secret"
FRONTEND_URL="https://your-frontend-domain.com"
```

### Build and Deploy

```bash
# Build the application
npm run build

# Run database migrations
npx prisma migrate deploy

# Start production server
npm run start:prod
```

## 🛠️ Development

### Database Operations

```bash
# Reset database (development only)
npx prisma migrate reset

# View database in browser
npx prisma studio

# Generate new migration
npx prisma migrate dev --name description
```

### Code Generation

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Lint and format code
npm run lint
npm run format
```

## 📈 Roadmap

### Phase 1: Core Backend ✅

- [x] Authentication system
- [x] Database schema
- [x] Registration flows
- [x] JWT security
- [x] Sample data

### Phase 2: Family Management _(In Progress)_

- [ ] Member relationship APIs
- [ ] Family management endpoints
- [ ] Invitation creation system
- [ ] Sub-family automation

### Phase 3: Tree Visualization _(Planned)_

- [ ] Tree data endpoints
- [ ] Privacy filtering
- [ ] Relationship calculation
- [ ] Export functionality

### Phase 4: Frontend Integration _(Planned)_

- [ ] Next.js frontend
- [ ] Interactive family tree
- [ ] Member profile management
- [ ] Real-time updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For questions and support:

- Open an issue in the repository
- Check the API documentation at `/docs`
- Review the test scripts for usage examples

---

**Built with ❤️ for families everywhere**
