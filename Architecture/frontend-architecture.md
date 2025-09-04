# Frontend Architecture - Next.js Implementation

## Overview

The frontend is built using Next.js 15 with the App Router, providing a modern React-based web application with server-side rendering, TypeScript support, and optimized performance. The architecture emphasizes component reusability, type safety, and efficient state management.

## Core Technologies

- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript 5.8.3
- **State Management**: Redux Toolkit 2.5.0 + React Query 5.62.0
- **Styling**: Tailwind CSS 3.4.17 with custom components
- **UI Components**: Radix UI primitives with shadcn/ui
- **Forms**: React Hook Form 7.60.0 with Zod 4.0.5 validation
- **Icons**: Lucide React 0.475.0
- **Charts**: D3.js 7.9.0 and Recharts 2.13.0
- **Build Tool**: Turbopack for development
- **Package Manager**: npm

## Application Structure

```
family-tree-frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page with auth routing
│   │   ├── ClientBody.tsx      # Client-side body component
│   │   └── ...                 # Additional pages/routes
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   │   ├── LoginForm.tsx   # Login form
│   │   │   └── RegisterForm.tsx # Registration form
│   │   ├── dialogs/            # Modal dialogs
│   │   │   ├── AddFamilyMemberDialog.tsx
│   │   │   ├── InviteOthersDialog.tsx
│   │   │   └── SettingsDialog.tsx
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...             # shadcn/ui components
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── FamilyTree.tsx      # Family tree visualization
│   │   ├── InteractiveFamilyTree.tsx
│   │   ├── SocialFeed.tsx      # Social feed component
│   │   ├── PostCard.tsx        # Post display component
│   │   ├── PostCreator.tsx     # Post creation component
│   │   ├── CommentSection.tsx  # Comments display
│   │   ├── NotificationPanel.tsx
│   │   ├── ImageUpload.tsx     # File upload component
│   │   ├── ExportManager.tsx   # Data export interface
│   │   ├── AdvancedSearch.tsx  # Search functionality
│   │   ├── FolderTreeView.tsx  # Alternative tree view
│   │   ├── RelationshipManager.tsx
│   │   ├── Providers.tsx       # Context providers
│   │   └── AuthInitializer.tsx # Auth state initialization
│   ├── hooks/                  # Custom React hooks
│   │   ├── api.ts              # API hooks with React Query
│   │   ├── redux.ts            # Redux store hooks
│   │   └── use-toast.ts        # Toast notification hook
│   ├── lib/                    # Utility libraries
│   │   ├── api.ts              # API client configuration
│   │   ├── queryClient.ts      # React Query client
│   │   ├── utils.ts            # Utility functions
│   │   └── ...                 # Additional utilities
│   ├── store/                  # Redux store
│   │   ├── index.ts            # Store configuration
│   │   └── slices/             # Redux slices
│   │       ├── authSlice.ts    # Authentication state
│   │       ├── familySlice.ts  # Family state
│   │       └── memberSlice.ts  # Member state
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts            # Global type definitions
│   ├── schemas/                # Zod validation schemas
│   │   ├── auth.ts             # Authentication schemas
│   │   ├── family.ts           # Family schemas
│   │   └── member.ts           # Member schemas
│   └── ...
├── public/                     # Static assets
├── .env.local                  # Environment variables
└── package.json                # Dependencies and scripts
```

## App Router Structure

### Root Layout (`app/layout.tsx`)

- Global CSS imports
- Font loading (Geist font family)
- Provider setup (Redux, React Query, Toast)
- Metadata configuration
- Root HTML structure

### Home Page (`app/page.tsx`)

- Authentication routing logic
- Conditional rendering based on auth state
- Dashboard or login/register components

### Client Components

- `ClientBody.tsx`: Main client-side wrapper
- Handles client-side only features
- Manages global state and routing

## Component Architecture

### 1. Authentication Components (`components/auth/`)

**LoginForm.tsx**

- Email/phone and password input fields
- Form validation with React Hook Form + Zod
- API integration for authentication
- Error handling and loading states
- Remember me functionality

**RegisterForm.tsx**

- Dual registration mode (create family vs. join family)
- Dynamic form fields based on registration type
- Invitation code validation for joining families
- Family creation with name and description
- Profile information collection

### 2. UI Components (`components/ui/`)

Built on Radix UI primitives with shadcn/ui styling:

- **Form Components**: Input, Textarea, Select, Checkbox
- **Layout Components**: Dialog, Popover, Tabs, Card
- **Feedback Components**: Toast, Alert, Badge
- **Navigation Components**: Button, Avatar, Label

### 3. Feature Components

**Dashboard.tsx**

- Main application dashboard
- Family overview and navigation
- Quick actions and shortcuts
- Recent activity feed

**FamilyTree.tsx & InteractiveFamilyTree.tsx**

- D3.js-powered family tree visualization
- Interactive node manipulation
- Zoom and pan controls
- Relationship display
- Export capabilities

**SocialFeed.tsx**

- Post listing with pagination
- Real-time updates
- Filtering by family/sub-family
- Like and comment interactions

**PostCard.tsx & PostCreator.tsx**

- Post display with media support
- Rich text editing
- File attachment handling
- Visibility controls

**CommentSection.tsx**

- Threaded comment display
- Reply functionality
- Like system
- Nested comment rendering

### 4. Dialog Components (`components/dialogs/`)

**AddFamilyMemberDialog.tsx**

- Member creation form
- Relationship selection
- Profile information input
- Family assignment

**InviteOthersDialog.tsx**

- Invitation creation interface
- Family selection
- Member stub creation
- Invitation link generation

**SettingsDialog.tsx**

- User preferences
- Privacy settings
- Notification preferences
- Account management

## State Management

### Redux Toolkit Store (`store/`)

**Global State Structure**:

```typescript
interface RootState {
  auth: AuthState;
  family: FamilyState;
  member: MemberState;
}
```

**Auth Slice** (`slices/authSlice.ts`):

- User authentication state
- JWT token management
- Login/logout actions
- User profile data

**Family Slice** (`slices/familySlice.ts`):

- Current family selection
- Family list management
- Family member data
- Family settings

**Member Slice** (`slices/memberSlice.ts`):

- Current member profile
- Member relationships
- Member search results
- Member editing state

### React Query Integration (`lib/queryClient.ts`)

**API Data Management**:

- Server state caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

**Custom API Hooks** (`hooks/api.ts`):

- Authentication hooks (login, register, refresh)
- Family management hooks
- Member CRUD operations
- Social feed hooks
- File upload hooks

## API Integration

### API Client (`lib/api.ts`)

**Configuration**:

- Base URL configuration
- Request/response interceptors
- Authentication header injection
- Error handling
- Request timeout settings

**Request Methods**:

- GET, POST, PUT, DELETE wrappers
- Automatic token refresh
- Retry logic for failed requests
- Response data transformation

### Data Fetching Patterns

**React Query Hooks**:

```typescript
// Example: Family data fetching
const useFamilies = () => {
  return useQuery({
    queryKey: ["families"],
    queryFn: () => api.get("/families"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Example: Member mutations
const useCreateMember = () => {
  return useMutation({
    mutationFn: (data: CreateMemberRequest) => api.post("/members", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};
```

## Form Management

### React Hook Form + Zod Integration

**Schema Definition** (`schemas/`):

```typescript
// Example: Login schema
export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Required"),
  password: z.string().min(6, "Minimum 6 characters"),
});

// Example: Member creation schema
export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  personalInfo: z
    .object({
      bio: z.string().optional(),
      birthDate: z.string().optional(),
    })
    .optional(),
});
```

**Form Components**:

- Type-safe form handling
- Automatic validation
- Error message display
- Form state management
- Submission handling

## Styling Architecture

### Tailwind CSS Configuration

**Design System**:

- Consistent color palette
- Typography scale
- Spacing system
- Component variants
- Dark mode support (planned)

**Custom Components**:

- Button variants (primary, secondary, outline, ghost)
- Input styling with focus states
- Card layouts with shadows and borders
- Responsive grid systems

### CSS Organization

**Global Styles** (`app/globals.css`):

- Tailwind directives
- Custom CSS variables
- Font loading
- Base element styling

**Component Styles**:

- Utility-first approach
- Responsive design
- Hover and focus states
- Animation and transitions

## Performance Optimizations

### Next.js Optimizations

- Automatic code splitting
- Image optimization with Next.js Image
- Font optimization
- Static generation where applicable

### React Optimizations

- React.memo for expensive components
- useMemo and useCallback for computations
- Lazy loading for heavy components
- Virtual scrolling for large lists

### Bundle Optimization

- Tree shaking
- Dynamic imports
- Code splitting by routes
- Asset optimization

## Testing Strategy

### Component Testing

- Unit tests for individual components
- Integration tests for component interactions
- Form validation testing
- API integration testing

### E2E Testing (Planned)

- User journey testing
- Critical path validation
- Cross-browser testing

## Development Workflow

### Development Scripts

- `npm run dev`: Development server with Turbopack
- `npm run build`: Production build
- `npm run start`: Production server
- `npm run lint`: ESLint checking
- `npm run format`: Code formatting with Biome

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Biome for code formatting
- Pre-commit hooks (planned)

## Deployment Architecture

### Build Process

- Static export capability
- API route handling
- Environment variable management
- Asset optimization

### Hosting Platforms

- Vercel (recommended for Next.js)
- Netlify (with adapter)
- Traditional hosting with Node.js

### Environment Configuration

- Development, staging, production environments
- Environment-specific API URLs
- Feature flags and configuration
- Secret management

## Accessibility (A11y)

### Implementation

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

### Component Libraries

- Radix UI provides built-in accessibility
- shadcn/ui follows accessibility best practices
- Custom components tested for A11y compliance

## Future Enhancements

### Planned Features

- Real-time updates with WebSockets
- Progressive Web App (PWA) capabilities
- Offline support
- Advanced search and filtering
- Mobile-responsive optimizations
- Theme customization
- Multi-language support

### Performance Improvements

- Service worker implementation
- Advanced caching strategies
- Bundle analysis and optimization
- CDN integration
- Database query optimization

This frontend architecture provides a scalable, maintainable, and performant foundation for the Family Tree Platform, leveraging modern React patterns and Next.js capabilities to deliver an exceptional user experience.
