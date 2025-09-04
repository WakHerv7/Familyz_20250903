# Family Tree Platform - Project Overview

## Project Purpose

The Family Tree Platform is a comprehensive web application designed to help users create, manage, and visualize their family trees with advanced social features. The platform enables families to maintain detailed genealogical records, share family stories, and stay connected through a modern, interactive interface.

## High-Level Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Backend (NestJS + Prisma)

- **Framework**: NestJS (Node.js framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with refresh tokens
- **API**: RESTful API with comprehensive endpoints
- **Features**: Family management, member relationships, invitations, social feed, file uploads, notifications, and data export

### Frontend (Next.js + React)

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **State Management**: Redux Toolkit + React Query
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Features**: Interactive family tree visualization, social feed, member profiles, file management, and data export

### Database Schema

- **ORM**: Prisma for type-safe database operations
- **Entities**: Users, Members, Families, Relationships, Posts, Comments, Invitations, Notifications, Files
- **Relationships**: Complex many-to-many relationships for family hierarchies and social connections

## Core Features

### 1. Dual Registration System

- Create new family trees
- Join existing families via secure invitations

### 2. Advanced Family Relationships

- Parent-child relationships (many-to-many)
- Spouse relationships (many-to-many)
- Multi-generational family trees
- Hierarchical family structure with sub-families

### 3. Social Features

- Social feed with posts and comments
- File sharing and media uploads
- Real-time notifications
- Privacy controls (Public, Family, Sub-family)

### 4. Data Management

- Comprehensive member profiles with flexible personal information
- File upload system for documents, images, videos, and audio
- Data export capabilities (PDF, Excel)
- Advanced search and filtering

### 5. Security & Privacy

- JWT authentication with role-based access control
- Privacy filtering based on family membership
- Secure invitation system with expiration
- Input validation and rate limiting

## Technology Stack

### Backend Technologies

- **Runtime**: Node.js
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js with JWT
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

### Frontend Technologies

- **Framework**: Next.js 15
- **Language**: TypeScript
- **State Management**: Redux Toolkit, React Query
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (shadcn/ui)
- **Forms**: React Hook Form with Zod validation
- **Charts**: D3.js, Recharts
- **File Processing**: jsPDF, xlsx

## Project Structure

```
Family-Tree-Platform/
├── family-tree-backend/          # NestJS backend application
│   ├── src/
│   │   ├── auth/                # Authentication module
│   │   ├── family/              # Family management
│   │   ├── member/              # Member profiles
│   │   ├── invitation/          # Invitation system
│   │   ├── post/                # Social feed posts
│   │   ├── comment/             # Comments system
│   │   ├── notification/        # Notification system
│   │   ├── upload/              # File upload handling
│   │   ├── export/              # Data export functionality
│   │   └── tree/                # Tree visualization
│   ├── prisma/                  # Database schema and migrations
│   └── uploads/                 # File storage directory
├── family-tree-frontend/         # Next.js frontend application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility libraries
│   │   ├── store/               # Redux store
│   │   ├── types/               # TypeScript definitions
│   │   └── schemas/             # Zod validation schemas
│   └── public/                  # Static assets
└── Architecture/                 # Project documentation (this folder)
```

## Development Workflow

1. **Backend Development**: API-first approach with comprehensive testing
2. **Frontend Development**: Component-driven development with TypeScript
3. **Database**: Schema-driven development with Prisma migrations
4. **Testing**: Unit tests, integration tests, and API testing
5. **Deployment**: Separate deployment pipelines for backend and frontend

## Key Design Principles

- **Modularity**: Clear separation of concerns with feature-based modules
- **Type Safety**: Full TypeScript coverage for both frontend and backend
- **Scalability**: Designed to handle growing family trees and user bases
- **Security**: Comprehensive authentication and authorization
- **User Experience**: Intuitive interface with real-time updates
- **Data Integrity**: Robust validation and relationship management

## Target Users

- **Family Historians**: Users interested in preserving family history
- **Large Families**: Families with complex relationships and multiple generations
- **Genealogy Enthusiasts**: Users researching their ancestry
- **Family Coordinators**: Individuals managing family communications and records

## Future Roadmap

- Real-time collaboration features
- Advanced visualization options
- Mobile applications
- Integration with genealogy databases
- Multi-language support
- Advanced analytics and insights

---

This platform represents a modern approach to family tree management, combining traditional genealogical features with contemporary social networking capabilities to create a comprehensive family management solution.
