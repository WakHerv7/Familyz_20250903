# Interactive Family Tree - Modular Architecture

This directory contains the refactored Interactive Family Tree component, broken down into a clean, modular architecture for better maintainability and scalability.

## 📁 Directory Structure

```
family-tree/
├── types/                    # TypeScript interfaces and types
│   ├── interfaces.ts        # Core interfaces (TreeNode, TreeLink, etc.)
│   └── index.ts             # Type exports
├── utils/                    # Utility functions
│   ├── helpers.ts           # Helper functions (getInitials, getGenderColor, etc.)
│   ├── treeData.ts          # Tree data building functions
│   └── index.ts             # Utility exports
├── layouts/                  # D3 layout functions
│   ├── d3Layouts.ts         # Hierarchical layout creation
│   └── index.ts             # Layout exports
├── hooks/                    # Custom React hooks
│   ├── useTreeZoom.ts       # Zoom/pan functionality
│   └── index.ts             # Hook exports
├── components/               # React components
│   ├── FamilyTreeItem.tsx   # Individual tree item component
│   ├── TreeControls.tsx     # Control buttons and zoom controls
│   ├── TreeLegend.tsx       # Visual legend for tree views
│   └── index.ts             # Component exports
├── InteractiveFamilyTree.tsx # Main component (uses all modules)
├── index.ts                 # Main export file
└── README.md               # This file
```

## 🎯 Key Features

### **Modular Architecture**

- **Separation of Concerns**: Each module has a single responsibility
- **Reusability**: Components and utilities can be reused independently
- **Maintainability**: Easy to modify, test, and extend individual parts
- **Type Safety**: Full TypeScript support with proper interfaces

### **Three View Modes**

1. **Explorer View**: Hierarchical tree starting from oldest ancestor
2. **Hierarchical View**: D3-based structured tree layout
3. **Force View**: Dynamic force-directed layout

### **Core Modules**

#### **Types (`types/`)**

- `TreeNode`: Represents individual nodes in the tree
- `TreeLink`: Represents connections between nodes
- `FamilyTreeNode`: Hierarchical tree structure for explorer view
- `InteractiveFamilyTreeProps`: Main component props
- `ViewMode`: Union type for view modes

#### **Utilities (`utils/`)**

- **Helpers**: Color generation, initials, generation calculations
- **Tree Data**: Functions to build tree structures from member data
- **Root Ancestor Detection**: Finds the oldest ancestor for proper tree structure

#### **Layouts (`layouts/`)**

- **D3 Hierarchical Layout**: Creates structured tree positioning
- **Auto-scaling**: Automatically fits tree to viewport
- **Centering**: Centers tree in available space

#### **Hooks (`hooks/`)**

- **Zoom Controls**: Handle zoom in/out, reset, fit-to-screen
- **SVG References**: Manage SVG element references

#### **Components (`components/`)**

- **FamilyTreeItem**: Recursive component for tree items
- **TreeControls**: All control buttons and zoom controls
- **TreeLegend**: Visual legend for different relationship types

## 🚀 Usage

### **Import the Main Component**

```typescript
import InteractiveFamilyTree from "@/components/family-tree";

// Use in your component
<InteractiveFamilyTree
  currentMember={memberData}
  onMemberClick={(memberId) => console.log(memberId)}
/>;
```

### **Import Individual Modules**

```typescript
// Import specific utilities
import {
  getGenderColor,
  calculateGenerations,
} from "@/components/family-tree/utils";

// Import types
import { TreeNode, ViewMode } from "@/components/family-tree/types";

// Import components
import { FamilyTreeItem } from "@/components/family-tree/components";
```

## 🔧 Development

### **Adding New Features**

1. **New Utility**: Add to `utils/` with proper exports
2. **New Component**: Add to `components/` with TypeScript interfaces
3. **New Hook**: Add to `hooks/` following React hooks patterns
4. **New Type**: Add to `types/interfaces.ts` with proper exports

### **Testing**

Each module can be tested independently:

- **Utils**: Pure functions, easy to unit test
- **Components**: Test with React Testing Library
- **Hooks**: Test with React Hooks Testing Library

### **Performance**

- **Tree Structure**: Efficient algorithms for large family trees
- **D3 Optimization**: Proper cleanup and memory management
- **React Optimization**: Proper memoization and re-rendering

## 📊 Architecture Benefits

### **Before (Monolithic)**

- ❌ Single 1100+ line file
- ❌ Hard to maintain and debug
- ❌ Difficult to test individual parts
- ❌ Tight coupling between concerns

### **After (Modular)**

- ✅ Clean separation of concerns
- ✅ Easy to maintain and extend
- ✅ Independent testing of modules
- ✅ Reusable components and utilities
- ✅ Better TypeScript support
- ✅ Improved developer experience

## 🎨 View Modes

### **Explorer View**

- Starts from oldest ancestor
- Hierarchical navigation with expand/collapse
- Shows complete family tree structure
- Best for browsing large family trees

### **Hierarchical View**

- D3-powered structured layout
- Generation-based positioning
- Interactive zoom and pan
- Best for visual family tree representation

### **Force View**

- Dynamic force-directed layout
- Physics-based node positioning
- Drag nodes to rearrange
- Best for exploring complex relationships

## 🔗 Integration

The modular structure maintains backward compatibility:

- Original import path still works
- All existing props and functionality preserved
- No breaking changes for existing usage

## 📈 Future Enhancements

The modular architecture makes it easy to add:

- **New View Modes**: Additional visualization types
- **Advanced Filtering**: Search and filter capabilities
- **Export Options**: Different export formats
- **Animation**: Smooth transitions between views
- **Performance**: Virtual scrolling for large trees
