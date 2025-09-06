# Family Tree Wheel Handler Implementation

## Overview

This document explains the implementation of the wheel handler for the SVG-based family tree visualization component (`SvgFamilyTree.tsx`). The goal was to move wheel event handling from the container div to the SVG element itself, disable default browser scroll behavior, and ensure wheel events only trigger when the mouse is over the SVG area.

## Problem Statement

Previously, wheel events were potentially interfering with normal page scrolling. The browser's default wheel behavior (page scrolling) needed to be disabled when interacting with the SVG family tree, but only when the mouse is actually over the SVG element.

## Solution Implementation

### 1. Mouse Position Tracking

Added state to track whether the mouse is currently over the SVG element:

```typescript
const [isMouseOverSvg, setIsMouseOverSvg] = useState(false);
```

### 2. SVG Event Handlers

Added mouse enter/leave handlers to the SVG element to update the tracking state:

```jsx
<svg
  // ... other props
  onMouseEnter={() => setIsMouseOverSvg(true)}
  onMouseLeave={() => setIsMouseOverSvg(false)}
  // ... other props
/>
```

### 3. Enhanced Wheel Handler

Modified the existing `handleWheel` function to only process wheel events when the mouse is over the SVG:

```typescript
const handleWheel = (event: React.WheelEvent) => {
  if (!isMouseOverSvg) return; // Only handle wheel when mouse is over SVG

  event.preventDefault();
  event.stopPropagation();

  // ... rest of zoom logic
};
```

### 4. Touch Action Disable

Added `touchAction: "none"` to the SVG style to disable browser's default touch/scroll behavior:

```jsx
<svg
  style={{
    background: "linear-gradient(135deg, #0c0033, #005318)",
    touchAction: "none", // Disable default scroll/zoom
  }}
  // ... other props
/>
```

### 5. Non-Passive Wheel Event Listener

Added a `useEffect` with a non-passive wheel event listener to guarantee `preventDefault()` works:

```typescript
useEffect(() => {
  const svgEl = svgRef.current;
  if (!svgEl) return;

  const fn = (e: WheelEvent) => {
    if (isMouseOverSvg) {
      e.preventDefault();
      handleWheel(e as any);
    }
  };

  svgEl.addEventListener("wheel", fn, { passive: false });
  return () => svgEl.removeEventListener("wheel", fn);
}, [isMouseOverSvg, zoomLevel]);
```

## Key Benefits

1. **Isolated Wheel Events**: Wheel zooming only occurs when the mouse cursor is over the SVG area
2. **Preserved Page Scrolling**: Normal page scrolling works when mouse is outside the SVG
3. **Guaranteed Prevention**: Non-passive listener ensures `preventDefault()` actually cancels browser scroll
4. **Touch Support**: `touchAction: "none"` disables default touch gestures on the SVG
5. **Clean Event Handling**: Events are properly stopped from propagating to parent elements

## Technical Details

- **File Modified**: `family-tree-frontend/src/components/family-tree/SvgFamilyTree.tsx`
- **React Hooks Used**: `useState`, `useEffect`, `useRef`
- **Event Types**: `React.WheelEvent`, native `WheelEvent`
- **Browser Compatibility**: Uses modern event listener options (`{ passive: false }`)

## Behavior

- **Mouse over SVG**: Wheel events trigger zoom in/out of the family tree
- **Mouse outside SVG**: Wheel events allow normal page scrolling
- **Touch devices**: Default touch scroll/zoom is disabled on the SVG
- **Event propagation**: Wheel events are prevented from bubbling up to parent elements

This implementation ensures a smooth user experience where the family tree zoom functionality is isolated to the SVG area while maintaining normal page navigation capabilities.
