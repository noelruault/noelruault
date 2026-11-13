export const c = {
  paper: "#FBF4E4",
  ink: "#111111",
  white: "#FFFFFF",
  yellow: "#FFC83D",
  pink: "#FF5FA2",
  mint: "#8CE6C3",
  violet: "#A78BFA",
  orange: "#FF7A1A",
  blue: "#7DB5FF",
  teal: "#19B8A6",
} as const;

export const PAGE_W = 880;
export const PAD = 24;
// Widest hard shadow any component casts; content is this much narrower than the page interior so no shadow is clipped.
export const SHADOW_MAX = 8;
export const CONTENT_W = PAGE_W - 2 * PAD - SHADOW_MAX;
export const STROKE = 3;
