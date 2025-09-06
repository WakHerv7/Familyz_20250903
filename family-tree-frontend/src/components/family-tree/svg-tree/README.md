# SVG Family Tree - Modular Architecture

This directory contains the refactored SVG Family Tree component, broken down into smaller, maintainable modules.

## 📁 Directory Structure

```
svg-tree/
├── index.ts                    # Main exports
├── SvgFamilyTree.tsx          # Main component (simplified)
├── README.md                  # This file
├── hooks/
│   └── useZoomPan.ts          # Zoom and pan functionality
├── utils/
│   ├── constants.ts           # Configuration constants
│   ├── treeCalculations.ts    # Position calculations
│   └── svgRendering.ts        # SVG element creation
└── components/
    └── TreeCanvas.tsx         # SVG canvas component
```

## 🔧 Key Improvements

### 1. **Separation of Concerns**

- **Constants**: Configuration and helper functions
- **Calculations**: Tree positioning and layout logic
- **Rendering**: SVG element creation and manipulation
- **Hooks**: State management and event handling
- **Components**: UI components

### 2. **Enhanced Zoom & Pan**

- Fixed mouse wheel zoom repositioning
- Dynamic pan speed based on zoom level
- Comprehensive console logging for debugging
- Stale closure prevention with refs

### 3. **Smart Spouse Spacing**

- Detects spouse relationships automatically
- Applies reduced spacing (50%) between spouses
- Maintains normal spacing for other generations

### 4. **Comprehensive Logging**

- Member coordinates tracking
- Zoom and pan operation details
- ViewBox calculations and updates
- Performance monitoring

## 🚀 Usage

```typescript
import SvgFamilyTree from "./svg-tree";

// Use as before - the API remains the same
<SvgFamilyTree
  currentMember={currentMember}
  onMemberClick={handleMemberClick}
  treeData={treeData}
  isLoading={isLoading}
  error={error}
/>;
```

## 🔍 Console Logging

The component now provides detailed console logging:

- **👤 Member coordinates** for each family member
- **🔍 Zoom operations** with detailed parameters
- **🖱️ Pan operations** with delta and speed info
- **📐 ViewBox updates** with calculation details

## 🛠️ Development

### Adding New Features

1. **Utils**: Add calculation/rendering logic to appropriate utils files
2. **Hooks**: Add state management to custom hooks
3. **Components**: Create new sub-components in the components folder
4. **Constants**: Update configuration in constants.ts

### Testing

- Each module can be tested independently
- Console logs provide debugging information
- Modular structure enables focused testing

## 📊 Performance Benefits

- **Smaller bundle sizes** through code splitting
- **Better tree shaking** with modular exports
- **Improved maintainability** with single responsibility
- **Enhanced debugging** with detailed logging
- **Easier testing** with isolated modules

## 🔄 Migration

The original `SvgFamilyTree.tsx` now simply re-exports the new modular component, ensuring backward compatibility while providing the improved architecture internally.
