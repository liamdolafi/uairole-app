// Mesmas cores do site (../uairole/app/globals.css)
export const C = {
  bg: "#0b0b12",
  surface: "#15151f",
  surface2: "#1e1e2b",
  line: "#2a2a3a",
  ink: "#f4f4f8",
  muted: "#9b9bb0",
  accent: "#ff2e88",
  accentSoft: "#ff2e8822",
  orange: "#ff7a1a",
  ok: "#3ddc97",
  warn: "#ffb020",
  danger: "#ff4d5e",
  white: "#ffffff",
};

export const F = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  bold: "Geist_700Bold",
  display: "BricolageGrotesque_700Bold",
  displayBlack: "BricolageGrotesque_800ExtraBold",
};

export const R = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

/** Gradiente do "Rolê da noite" */
export const NIGHT_GRADIENT = [C.accent, C.orange] as const;
