// Configuration constants for SVG Family Tree
export const CONFIG = {
  gap_v: 400, // Vertical gap between generations
  gap_h: 180, // Horizontal gap between family members
  radius: 35, // Circle radius
  extraRadiusWidth: 6, // Extra width for couple connections
  padding_h: 25,
  padding_v: 25,
  minZoom: 0.1,
  maxZoom: 20.0,
  zoomStep: 0.25,
  fontSize: {
    initials: 16, // Increased from 12-14
    name: 14, // Increased from 11
    generation: 12, // New for generation numbers
  },
};

// Helper functions
export const generateRandomHSLColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 50%, 50%)`;
};

export const getFirst2Initials = (name: string) => {
  if (!name) return "";
  const names = name.split(" ");
  return names
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const toRadians = (angle: number) => angle * (Math.PI / 180);
