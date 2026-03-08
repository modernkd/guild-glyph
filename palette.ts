export interface Palette {
  bg: string;
  fg: string;
  accent: string;
  dim: string;
}

/**
 * 12 dark-background palettes with vivid, perceptually distinct foreground colors.
 * Selected by (hash % PALETTE.length) — never random at runtime.
 */
export const PALETTE: Palette[] = [
  { bg: "#111218", fg: "#e8c547", accent: "#f0a500", dim: "#2e2808" },
  { bg: "#0c1a18", fg: "#3ecfb0", accent: "#2dd4bf", dim: "#082e28" },
  { bg: "#13101e", fg: "#a78bfa", accent: "#c084fc", dim: "#1a0e3a" },
  { bg: "#161010", fg: "#f87171", accent: "#fb923c", dim: "#2e1010" },
  { bg: "#0d1520", fg: "#60a5fa", accent: "#818cf8", dim: "#0d1f3c" },
  { bg: "#181410", fg: "#fbbf24", accent: "#f97316", dim: "#2e2008" },
  { bg: "#0c1810", fg: "#4ade80", accent: "#34d399", dim: "#0a2818" },
  { bg: "#18101a", fg: "#f472b6", accent: "#e879f9", dim: "#280a30" },
  { bg: "#101418", fg: "#38bdf8", accent: "#67e8f9", dim: "#081828" },
  { bg: "#181210", fg: "#fb7185", accent: "#f43f5e", dim: "#2e0c14" },
  { bg: "#141818", fg: "#a3e635", accent: "#84cc16", dim: "#182808" },
  { bg: "#181818", fg: "#d1d5db", accent: "#9ca3af", dim: "#242428" },
];
