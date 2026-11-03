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
  // rosa mais fechado pra fundo de botão com texto branco (contraste 4,6:1)
  accentStrong: "#e0177a",
  orangeStrong: "#c2410c",
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

/** Gradiente do Holofote (com texto branco por cima) */
export const HOLOFOTE_GRADIENT = [C.accentStrong, C.orangeStrong] as const;

/** Área mínima de toque (acessibilidade) */
export const TOUCH = 44;
