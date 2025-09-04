// Family Tree Spacing Configuration
// All spacing values are centralized here for easy editing

export const TREE_SPACING = {
  // Backend spacing (used in tree.service.ts)
  backend: {
    levelWidth: 800, // Horizontal spacing between generations (was 400, doubled)
    levelHeight: 400, // Vertical spacing between levels (was 200, doubled)
    spouseSpacing: 300, // Horizontal spacing for spouses (was 150, doubled)
    minSiblingSpacing: 500, // Minimum spacing between siblings (was 250, doubled)
    spouseVerticalOffset: 50, // Vertical offset for spouses with no parents
  },

  // Frontend spacing (used in InteractiveFamilyTree.tsx and layouts)
  frontend: {
    collisionRadius: 160, // Node collision radius (was 80, doubled)
    linkDistances: {
      spouse: 240, // Spouse connection distance (was 120, doubled)
      sameGeneration: 360, // Same generation distance (was 180, doubled)
      differentGeneration: 440, // Different generation distance (was 220, doubled)
    },
    forceLayout: {
      chargeStrength: -800, // Node repulsion strength (was -400, doubled magnitude)
      verticalSpacing: 300, // Vertical force spacing (was 150, doubled)
      verticalStrength: 0.3, // Vertical force strength (unchanged)
    },
    layout: {
      padding: 300, // Layout padding (was 150, doubled)
      maxZoomOut: 1.2, // Maximum zoom out factor (unchanged)
    },
  },
} as const;

// Helper functions to access spacing values
export const getBackendSpacing = () => TREE_SPACING.backend;
export const getFrontendSpacing = () => TREE_SPACING.frontend;
export const getLinkDistance = (
  type: "spouse" | "sameGeneration" | "differentGeneration"
) => TREE_SPACING.frontend.linkDistances[type];
