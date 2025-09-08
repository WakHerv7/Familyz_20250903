# Edit Member Process Documentation

## Overview

This document explains the complete process of editing family members in the Family Tree application, from user interaction to technical implementation.

## Table of Contents

1. [User Journey](#user-journey)
2. [Technical Architecture](#technical-architecture)
3. [Component Interactions](#component-interactions)
4. [Data Flow](#data-flow)
5. [Form Management](#form-management)
6. [Relationship Management](#relationship-management)
7. [API Integration](#api-integration)
8. [Error Handling](#error-handling)
9. [Future Backend Integration](#future-backend-integration)

## User Journey

### Step 1: Accessing Edit Functionality

1. **Navigate to Folder Tree View**

   - User goes to the folder tree page (`/folder`)
   - The `FolderTreeView` component loads and displays the family tree

2. **Locate Target Member**

   - User finds the member they want to edit in the tree structure
   - Members are displayed with their names and relationship information

3. **Open Edit Menu**
   - User clicks on a member's name
   - A dropdown menu appears with options:
     - View infos
     - **Edit infos** ← This triggers the edit process
     - Add a parent/spouse/child

### Step 2: Edit Member Dialog

1. **Dialog Opens**

   - Clicking "Edit infos" calls `handleEditInfo(node, memberName)`
   - This function:
     - Extracts member ID from the tree node data
     - Sets `selectedMemberId` state
     - Opens the `EditMemberDialog` component

2. **Data Loading**

   - Dialog fetches member details using React Query
   - API call: `GET /members/{memberId}`
   - Displays loading spinner while fetching data

3. **Form Pre-population**
   - Member data is loaded and form fields are pre-filled:
     - Basic info (name, gender, status)
     - Personal info (bio, birth details, occupation, contact)
     - Existing relationships (parents, children, spouses)

### Step 3: Editing Process

1. **Modify Basic Information**

   - User can edit:
     - Full name (required)
     - Gender selection
     - Status (Active/Inactive/Deceased)
     - Family role (display only)

2. **Update Personal Information**

   - Biography text area
   - Birth date and place
   - Occupation
   - Phone number and email

3. **Manage Relationships**
   - View current relationships with avatars and badges
   - Add new relationships:
     - Select family member from dropdown
     - Choose relationship type (Parent/Child/Spouse)
     - Click "Add Relationship"
   - Remove existing relationships:
     - Click trash icon next to relationship
     - Relationship is removed from the list

### Step 4: Save Changes

1. **Form Submission**

   - User clicks "Save Changes" button
   - Form validation runs using Zod schema
   - Data is prepared for submission

2. **Current Implementation**
   - Shows placeholder message: "Member editing functionality is coming soon!"
   - Displays alert with edit data for demonstration
   - Dialog closes after confirmation

## Technical Architecture

### Component Structure

```
FolderTreeView (Main Component)
├── TreeNode Rendering
├── DropdownMenu (for each member)
│   ├── "Edit infos" MenuItem
│   └── handleEditInfo() function
└── EditMemberDialog (Child Component)
    ├── Form Management (React Hook Form)
    ├── Data Fetching (React Query)
    ├── Relationship Management
    └── Validation (Zod)
```

### Key Components

#### 1. FolderTreeView Component

- **Location**: `src/components/FolderTreeView.tsx`
- **Purpose**: Main tree view component that handles member selection
- **Key Functions**:
  - `handleEditInfo()`: Triggers edit dialog for selected member
  - `renderTreeNode()`: Renders individual tree nodes with dropdown menus

#### 2. EditMemberDialog Component

- **Location**: Inside `FolderTreeView.tsx` (EditMemberDialog function)
- **Purpose**: Modal dialog for editing member information
- **Key Features**:
  - Form state management with React Hook Form
  - Data fetching with React Query
  - Relationship management interface
  - Validation with Zod schema

### State Management

#### Local State Variables

```typescript
const [showEditDialog, setShowEditDialog] = useState(false);
const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
const [relationships, setRelationships] = useState<RelationshipEntry[]>([]);
const [selectedMember, setSelectedMember] = useState<Member | null>(null);
const [relationshipType, setRelationshipType] =
  useState<RelationshipType | null>(null);
```

#### Form State (React Hook Form)

```typescript
const {
  register,
  handleSubmit,
  setValue,
  watch,
  reset,
  formState: { errors },
} = useForm<UpdateMemberRequest>({
  resolver: zodResolver(updateProfileSchema),
});
```

## Component Interactions

### 1. User Interaction Flow

```
User Clicks Member Name
    ↓
Dropdown Menu Opens
    ↓
User Selects "Edit infos"
    ↓
handleEditInfo() Called
    ↓
selectedMemberId Set
    ↓
showEditDialog = true
    ↓
EditMemberDialog Renders
```

### 2. Data Loading Flow

```
EditMemberDialog Mounts
    ↓
useQuery Triggers: GET /members/{memberId}
    ↓
Loading State Displayed
    ↓
Data Received
    ↓
Form Pre-populated
    ↓
Relationships Initialized
    ↓
Dialog Fully Interactive
```

### 3. Form Submission Flow

```
User Clicks "Save Changes"
    ↓
handleSubmit() Called
    ↓
Form Validation (Zod)
    ↓
onSubmit() Function
    ↓
Data Preparation
    ↓
Placeholder Alert Shown
    ↓
Dialog Closes
```

## Data Flow

### Input Data Structure

#### Member Data (from API)

```typescript
interface MemberWithRelationships {
  id: string;
  name: string;
  gender: Gender;
  status: MemberStatus;
  personalInfo?: {
    bio?: string;
    birthDate?: string;
    birthPlace?: string;
    occupation?: string;
    phoneNumber?: string;
    email?: string;
  };
  parents: Member[];
  children: Member[];
  spouses: Member[];
  familyMemberships: FamilyMembership[];
}
```

#### Form Data Structure

```typescript
interface UpdateMemberRequest {
  name: string;
  gender: Gender;
  status: MemberStatus;
  personalInfo?: {
    bio?: string;
    birthDate?: string;
    birthPlace?: string;
    occupation?: string;
    phoneNumber?: string;
    email?: string;
  };
}
```

### Relationship Data Structure

```typescript
interface RelationshipEntry {
  relatedMemberId: string;
  relatedMemberName: string;
  relationshipType: RelationshipType;
}
```

## Form Management

### React Hook Form Integration

#### Form Registration

```typescript
// Basic fields
<Input {...register("name", { required: "Name is required" })} />

// Nested fields
<Input {...register("personalInfo.email")} />

// Select fields
<Select onValueChange={(value) => setValue("gender", value as Gender)}>
```

#### Form Validation

```typescript
const {
  resolver: zodResolver(updateProfileSchema)
} = useForm<UpdateMemberRequest>();
```

#### Form Submission

```typescript
const onSubmit = async (data: UpdateMemberRequest) => {
  // Handle form submission
  console.log("Edit member data:", data);
  console.log("Relationships to update:", relationships);
};
```

### Zod Validation Schema

```typescript
// Located in: src/schemas/member.ts
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.nativeEnum(Gender).optional(),
  status: z.nativeEnum(MemberStatus).optional(),
  personalInfo: z
    .object({
      bio: z.string().optional(),
      birthDate: z.string().optional(),
      birthPlace: z.string().optional(),
      occupation: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
});
```

## Relationship Management

### Current Relationships Display

1. **Data Initialization**

   - When member data loads, existing relationships are extracted
   - Parents, children, and spouses are converted to `RelationshipEntry` objects
   - Stored in local `relationships` state

2. **Visual Display**
   - Each relationship shows:
     - Avatar with member initials
     - Member name
     - Relationship type badge (Parent/Child/Spouse)
     - Delete button (trash icon)

### Adding New Relationships

1. **Member Selection**

   - React Select dropdown with available family members
   - Excludes current member and existing relationships
   - Shows avatars and names for better UX

2. **Relationship Type Selection**

   - Dropdown with options: Parent, Child, Spouse
   - Dynamic text based on selected member

3. **Relationship Creation**
   - Click "Add Relationship" button
   - New `RelationshipEntry` added to relationships array
   - UI updates immediately

### Removing Relationships

1. **Delete Action**

   - Click trash icon next to relationship
   - `removeRelationship(index)` function called
   - Relationship removed from local state array

2. **UI Update**
   - Relationship disappears from list
   - Available members list updates (removed member becomes available again)

## API Integration

### Current Implementation

#### Data Fetching

```typescript
const { data: member, isLoading } = useQuery({
  queryKey: ["member", memberId],
  queryFn: async () => {
    if (!memberId) return null;
    const response = await apiClient.get<MemberWithRelationships>(
      `/members/${memberId}`
    );
    return response;
  },
  enabled: open && !!memberId,
});
```

#### Family Members Fetching

```typescript
const { data: familyMembers = [] } = useFamilyMembers(
  member?.familyMemberships?.[0]?.familyId || ""
);
```

### Future Backend Integration

#### Planned API Endpoints

1. **Update Member Information**

   ```
   PUT /members/{memberId}
   Body: UpdateMemberRequest
   Response: MemberWithRelationships
   ```

2. **Add Relationship**

   ```
   POST /members/{memberId}/relationships
   Body: { relatedMemberId: string, relationshipType: RelationshipType }
   Response: { success: boolean, message: string }
   ```

3. **Remove Relationship**
   ```
   DELETE /members/{memberId}/relationships/{relatedMemberId}
   Response: { success: boolean, message: string }
   ```

#### Permission Requirements

- `EDIT_MEMBERS` permission required for editing other members
- `EDIT_OWN_PROFILE` permission for self-editing
- Family membership validation
- Relationship validation (prevent duplicates, circular references)

## Error Handling

### Form Validation Errors

1. **Required Fields**

   - Name field shows "Name is required" if empty
   - Email field validates proper email format

2. **Field-Level Errors**
   - Displayed below each invalid field
   - Real-time validation feedback

### API Error Handling

1. **Network Errors**

   - API call failures handled by React Query
   - Error boundaries prevent app crashes

2. **Data Loading Errors**
   - Member not found shows appropriate message
   - Loading states prevent premature interactions

### User Feedback

1. **Loading States**

   - Spinner during data fetching
   - Disabled buttons during form submission

2. **Success Messages**

   - Toast notifications for successful operations
   - Visual feedback for relationship changes

3. **Error Messages**
   - Alert dialogs for validation errors
   - Console logging for debugging

## Future Backend Integration

### Phase 1: Basic Member Updates

1. **Implement PUT /members/{memberId} endpoint**
2. **Add permission checks** (EDIT_MEMBERS, EDIT_OWN_PROFILE)
3. **Validate family membership**
4. **Update member information in database**

### Phase 2: Relationship Management

1. **Implement relationship CRUD endpoints**
2. **Add relationship validation** (prevent duplicates, circular references)
3. **Update relationship tables** in database
4. **Handle cascading updates** to family tree structure

### Phase 3: Advanced Features

1. **Bulk relationship updates**
2. **Relationship history/audit trail**
3. **Conflict resolution** for concurrent edits
4. **Real-time updates** via WebSocket

### Integration Steps

1. **Replace placeholder alert** with actual API calls
2. **Add proper error handling** for API responses
3. **Implement optimistic updates** for better UX
4. **Add loading states** for API operations
5. **Handle permission errors** gracefully

### Migration Path

```typescript
// Current placeholder implementation
const onSubmit = async (data: UpdateMemberRequest) => {
  alert("Member editing functionality is coming soon!");
  onOpenChange(false);
};

// Future implementation
const onSubmit = async (data: UpdateMemberRequest) => {
  try {
    // Update member information
    await updateMemberMutation.mutateAsync({
      memberId,
      data,
    });

    // Update relationships
    await updateRelationshipsMutation.mutateAsync({
      memberId,
      relationships,
    });

    toast.success("Member updated successfully!");
    onOpenChange(false);
  } catch (error) {
    toast.error("Failed to update member");
  }
};
```

## Conclusion

The edit member process provides a comprehensive interface for managing family member information and relationships. The current implementation includes:

- ✅ Complete frontend UI with form validation
- ✅ Relationship management interface
- ✅ Data pre-population and state management
- ✅ Error handling and user feedback
- ✅ Responsive design with consistent theming

The system is ready for backend integration, with clear API specifications and migration path defined for future development.
