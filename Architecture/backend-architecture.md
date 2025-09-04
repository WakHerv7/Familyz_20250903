# Backend Architecture - NestJS Implementation

## Overview

The backend is built using NestJS, a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It provides a robust foundation for the Family Tree Platform's API with modular architecture, dependency injection, and comprehensive middleware support.

## Core Technologies

- **Framework**: NestJS v10.0.0
- **Runtime**: Node.js v16+
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js with JWT strategy
- **Validation**: class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with Supertest
- **Process Management**: PM2 (production)

## Application Structure

```
family-tree-backend/
├── src/
│   ├── app.module.ts              # Root application module
│   ├── main.ts                    # Application entry point
│   ├── auth/                      # Authentication module
│   ├── user/                      # User management
│   ├── member/                    # Family member management
│   ├── family/                    # Family and sub-family management
│   ├── invitation/                # Invitation system
│   ├── tree/                      # Tree visualization APIs
│   ├── post/                      # Social feed posts
│   ├── comment/                   # Comments system
│   ├── notification/              # Notification system
│   ├── upload/                   # File upload handling
│   ├── export/                   # Data export functionality
│   ├── common/                   # Shared utilities and decorators
│   └── prisma/                   # Database service
├── prisma/
│   ├── schema.prisma             # Database schema definition
│   ├── seed.ts                   # Database seeding script
│   └── migrations/               # Database migration files
├── test/                         # Test files
├── uploads/                      # File storage directory
└── dist/                         # Compiled JavaScript (build output)
```

## Module Architecture

### 1. Authentication Module (`src/auth/`)

**Purpose**: Handles user authentication, registration, and JWT token management.

**Components**:

- `auth.controller.ts`: HTTP endpoints for login, registration, token refresh
- `auth.service.ts`: Business logic for authentication flows
- `auth.module.ts`: Module configuration and dependency injection
- `strategies/jwt.strategy.ts`: Passport JWT strategy implementation
- `guards/jwt-auth.guard.ts`: Route protection guard
- `dto/auth.dto.ts`: Data transfer objects for requests/responses

**Key Features**:

- Dual registration system (create family vs. join family)
- JWT token generation with refresh tokens
- Password hashing with bcrypt
- Invitation-based family joining
- Role-based access control

### 2. User Module (`src/user/`)

**Purpose**: Manages user accounts and basic user operations.

**Components**:

- `user.module.ts`: User module configuration
- Additional user-related services (planned)

### 3. Member Module (`src/member/`)

**Purpose**: Manages family member profiles and personal information.

**Components**:

- `member.controller.ts`: CRUD operations for members
- `member.service.ts`: Member business logic
- `member.module.ts`: Module configuration
- `dto/member.dto.ts`: Member data transfer objects

**Key Features**:

- Flexible personal information storage (JSON field)
- Member status tracking (Active, Inactive, Deceased, Archived)
- Profile picture management
- Relationship management integration

### 4. Family Module (`src/family/`)

**Purpose**: Handles family groups, sub-families, and membership management.

**Components**:

- `family.controller.ts`: Family CRUD operations
- `family.service.ts`: Family business logic
- `family.module.ts`: Module configuration
- `dto/family.dto.ts`: Family data transfer objects

**Key Features**:

- Hierarchical family structure (main families and sub-families)
- Family membership with roles (Admin, Member, Head, Viewer)
- Automatic sub-family creation based on relationships
- Family privacy and access control

### 5. Invitation Module (`src/invitation/`)

**Purpose**: Manages secure family invitations and member onboarding.

**Components**:

- `invitation.controller.ts`: Invitation CRUD operations
- `invitation.service.ts`: Invitation business logic
- `invitation.module.ts`: Module configuration
- `dto/invitation.dto.ts`: Invitation data transfer objects

**Key Features**:

- JWT-based invitation tokens with expiration
- Invitation status tracking
- Profile stubs for invited members
- Secure invitation validation

### 6. Tree Module (`src/tree/`)

**Purpose**: Provides APIs for family tree visualization and data retrieval.

**Components**:

- `tree.controller.ts`: Tree data endpoints
- `tree.service.ts`: Tree calculation and formatting logic
- `tree.module.ts`: Module configuration
- `dto/tree.dto.ts`: Tree data transfer objects

**Key Features**:

- Hierarchical tree data generation
- Privacy filtering based on user permissions
- Multiple visualization formats
- Relationship calculation algorithms

### 7. Post Module (`src/post/`)

**Purpose**: Manages social feed posts and content sharing.

**Components**:

- `post.controller.ts`: Post CRUD operations
- `post.service.ts`: Post business logic
- `post.module.ts`: Module configuration
- `dto/post.dto.ts`: Post data transfer objects

**Key Features**:

- Multi-media post support (text, images, files, videos)
- Visibility controls (Public, Family, Sub-family)
- Like functionality
- Post metadata and engagement tracking

### 8. Comment Module (`src/comment/`)

**Purpose**: Handles comments on posts with threading support.

**Components**:

- `comment.controller.ts`: Comment CRUD operations
- `comment.service.ts`: Comment business logic
- `comment.module.ts`: Module configuration
- `dto/comment.dto.ts`: Comment data transfer objects

**Key Features**:

- Threaded comment system
- Nested replies support
- Like functionality for comments
- Comment moderation capabilities

### 9. Notification Module (`src/notification/`)

**Purpose**: Manages user notifications and real-time updates.

**Components**:

- `notification.controller.ts`: Notification endpoints
- `notification.service.ts`: Notification business logic
- `notification.module.ts`: Module configuration
- `dto/notification.dto.ts`: Notification data transfer objects

**Key Features**:

- Multiple notification types (likes, comments, mentions)
- Notification status tracking (read/unread)
- Bulk notification operations
- Notification preferences

### 10. Upload Module (`src/upload/`)

**Purpose**: Handles file uploads and media management.

**Components**:

- `upload.controller.ts`: File upload endpoints
- `upload.service.ts`: File processing logic
- `upload.module.ts`: Module configuration
- `dto/upload.dto.ts`: Upload data transfer objects

**Key Features**:

- Multiple file type support (images, documents, videos, audio)
- File validation and security
- Profile image management
- File attachment system

### 11. Export Module (`src/export/`)

**Purpose**: Provides data export capabilities for family trees.

**Components**:

- `export.controller.ts`: Export endpoints
- `export.service.ts`: Export processing logic
- `export.module.ts`: Module configuration
- `dto/export.dto.ts`: Export data transfer objects

**Key Features**:

- Multiple export formats (PDF, Excel)
- Configurable export options
- Privacy-aware data inclusion
- Batch export processing

## Common Module (`src/common/`)

**Purpose**: Shared utilities, decorators, and middleware.

**Components**:

- `decorators/current-user.decorator.ts`: Current user injection
- `decorators/public.decorator.ts`: Public route marking
- Additional shared utilities and interceptors

## Database Layer (`src/prisma/`)

**Purpose**: Database connection and query management.

**Components**:

- `prisma.module.ts`: Prisma module configuration
- `prisma.service.ts`: Database service with query methods

**Key Features**:

- Type-safe database operations
- Connection pooling
- Transaction management
- Query optimization

## Security Implementation

### Authentication Flow

1. User submits credentials or invitation code
2. Password verification or invitation validation
3. JWT access and refresh tokens generation
4. Token storage and automatic refresh
5. Route protection with guards

### Authorization

- Role-based access control (RBAC)
- Family membership verification
- Privacy filtering based on relationships
- Resource ownership validation

### Data Protection

- Input validation with class-validator
- SQL injection prevention via Prisma
- XSS protection with input sanitization
- Rate limiting with @nestjs/throttler

## API Design

### RESTful Endpoints

- Consistent URL patterns (`/api/v1/resource`)
- HTTP method semantics (GET, POST, PUT, DELETE)
- Proper status codes and error responses
- Pagination support for list endpoints

### Data Transfer Objects (DTOs)

- Request validation with class-validator
- Response formatting
- Type safety with TypeScript interfaces
- API documentation with Swagger

### Error Handling

- Global exception filters
- Structured error responses
- Logging and monitoring
- User-friendly error messages

## Testing Strategy

### Unit Tests

- Service layer testing with mocked dependencies
- Controller testing with mocked services
- Utility function testing
- Validation logic testing

### Integration Tests

- Database integration testing
- API endpoint testing with Supertest
- Authentication flow testing
- Module interaction testing

### E2E Tests

- Complete user journey testing
- API contract validation
- Performance testing
- Security testing

## Deployment Architecture

### Development Environment

- Local PostgreSQL database
- Hot reload with `npm run start:dev`
- Debug mode support
- Local file storage

### Production Environment

- Docker containerization
- Environment-specific configurations
- Database migration on startup
- Static file serving
- Process management with PM2

### Scalability Considerations

- Stateless API design
- Database connection pooling
- Caching strategies
- Horizontal scaling support
- CDN integration for file serving

## Performance Optimizations

- Database query optimization with Prisma
- Efficient relationship loading
- Pagination for large datasets
- File compression and optimization
- Response caching
- Background job processing for heavy operations

## Monitoring and Logging

- Structured logging with Winston
- Error tracking and alerting
- Performance monitoring
- Database query monitoring
- API usage analytics

This backend architecture provides a solid foundation for the Family Tree Platform, with modular design, comprehensive security, and scalability considerations built-in from the ground up.
