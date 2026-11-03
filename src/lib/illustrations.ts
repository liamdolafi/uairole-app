// Ilustrações das categorias (desenho próprio, SVG 120x120). Gerado por scripts/marca/gerar-ilustracoes.mjs.
// O mesmo arquivo existe no site (lib/illustrations.ts) e no app (src/lib/illustrations.ts): se mudar um, mude o outro.
import type { Category } from "./types";

export type Shape =
  | { t: "c"; cx: number; cy: number; r: number; fill: string; o?: number }
  | { t: "e"; cx: number; cy: number; rx: number; ry: number; fill: string; o?: number }
  | { t: "r"; x: number; y: number; w: number; h: number; rx?: number; fill: string; o?: number }
  | { t: "p"; d: string; fill?: string; stroke?: string; sw?: number; o?: number };

export const ILLUSTRATIONS: Record<Category, Shape[]> = {
  festa: [
    {
      t: "p",
      d: "M60 6V24",
      stroke: "#9b9bb0",
      sw: 3
    },
    {
      t: "c",
      cx: 60,
      cy: 60,
      r: 34,
      fill: "#ff2e88"
    },
    {
      t: "p",
      d: "M29 47Q60 39 91 47M26 61Q60 55 94 61M30 75Q60 71 90 75M60 26V94M45 30Q35 60 45 90M75 30Q85 60 75 90",
      stroke: "#f4f4f8",
      sw: 2.5,
      o: 0.35
    },
    {
      t: "c",
      cx: 48,
      cy: 45,
      r: 7,
      fill: "#f4f4f8",
      o: 0.9
    },
    {
      t: "p",
      d: "M101 14Q101 24 111 24Q101 24 101 34Q101 24 91 24Q101 24 101 14Z",
      fill: "#ffb020"
    },
    {
      t: "p",
      d: "M18 86Q18 94 26 94Q18 94 18 102Q18 94 10 94Q18 94 18 86Z",
      fill: "#ffb020"
    },
    {
      t: "c",
      cx: 18,
      cy: 30,
      r: 4,
      fill: "#3ddc97"
    },
    {
      t: "c",
      cx: 104,
      cy: 92,
      r: 5,
      fill: "#ff7a1a"
    }
  ],
  show: [
    {
      t: "p",
      d: "M22 28Q14 40 22 52M98 28Q106 40 98 52",
      stroke: "#ffb020",
      sw: 5
    },
    {
      t: "p",
      d: "M12 22Q3 40 12 58M108 22Q117 40 108 58",
      stroke: "#ff7a1a",
      sw: 4,
      o: 0.8
    },
    {
      t: "p",
      d: "M36 50A24 24 0 0 0 84 50",
      stroke: "#f4f4f8",
      sw: 6
    },
    {
      t: "r",
      x: 44,
      y: 14,
      w: 32,
      h: 50,
      rx: 16,
      fill: "#ff2e88"
    },
    {
      t: "p",
      d: "M44 32H76M44 44H76",
      stroke: "#0b0b12",
      sw: 3,
      o: 0.3
    },
    {
      t: "c",
      cx: 53,
      cy: 24,
      r: 3.5,
      fill: "#f4f4f8",
      o: 0.8
    },
    {
      t: "p",
      d: "M60 74V92M46 96H74",
      stroke: "#f4f4f8",
      sw: 6
    }
  ],
  pelada: [
    {
      t: "r",
      x: 8,
      y: 94,
      w: 104,
      h: 12,
      rx: 6,
      fill: "#3ddc97"
    },
    {
      t: "p",
      d: "M10 42H24M6 56H20M10 70H22",
      stroke: "#ff2e88",
      sw: 4
    },
    {
      t: "c",
      cx: 60,
      cy: 56,
      r: 32,
      fill: "#f4f4f8"
    },
    {
      t: "p",
      d: "M60 45L70.46 52.6L66.47 64.9L53.53 64.9L49.54 52.6Z",
      fill: "#0b0b12"
    },
    {
      t: "p",
      d: "M60 34L54.77 30.2L56.77 24.05L63.23 24.05L65.23 30.2Z",
      fill: "#0b0b12"
    },
    {
      t: "p",
      d: "M80.92 49.2L82.92 43.05L89.38 43.05L91.38 49.2L86.15 53Z",
      fill: "#0b0b12"
    },
    {
      t: "p",
      d: "M72.93 73.8L79.39 73.8L81.39 79.95L76.16 83.75L70.93 79.95Z",
      fill: "#0b0b12"
    },
    {
      t: "p",
      d: "M47.07 73.8L49.07 79.95L43.84 83.75L38.61 79.95L40.61 73.8Z",
      fill: "#0b0b12"
    },
    {
      t: "p",
      d: "M39.08 49.2L33.85 53L28.62 49.2L30.62 43.05L37.08 43.05Z",
      fill: "#0b0b12"
    },
    {
      t: "p",
      d: "M60 45L60 31M70.46 52.6L83.78 48.27M66.47 64.9L74.69 76.23M53.53 64.9L45.31 76.23M49.54 52.6L36.22 48.27",
      stroke: "#0b0b12",
      sw: 3
    }
  ],
  esporte: [
    {
      t: "p",
      d: "M36 8H54L70 46L56 50Z",
      fill: "#ff2e88"
    },
    {
      t: "p",
      d: "M84 8H66L50 46L64 50Z",
      fill: "#ff7a1a"
    },
    {
      t: "c",
      cx: 60,
      cy: 76,
      r: 29,
      fill: "#ffb020"
    },
    {
      t: "c",
      cx: 60,
      cy: 76,
      r: 20,
      fill: "#e08f00",
      o: 0.55
    },
    {
      t: "p",
      d: "M60 64L63.23 72.55L72.36 72.98L65.23 78.7L67.64 87.52L60 82.5L52.36 87.52L54.77 78.7L47.64 72.98L56.77 72.55Z",
      fill: "#f4f4f8"
    },
    {
      t: "p",
      d: "M101 62Q101 70 109 70Q101 70 101 78Q101 70 93 70Q101 70 101 62Z",
      fill: "#f4f4f8",
      o: 0.9
    }
  ],
  feira: [
    {
      t: "r",
      x: 23,
      y: 36,
      w: 6,
      h: 62,
      rx: 3,
      fill: "#9b9bb0"
    },
    {
      t: "r",
      x: 91,
      y: 36,
      w: 6,
      h: 62,
      rx: 3,
      fill: "#9b9bb0"
    },
    {
      t: "r",
      x: 10,
      y: 16,
      w: 100,
      h: 9,
      rx: 4.5,
      fill: "#ff2e88"
    },
    {
      t: "r",
      x: 14,
      y: 22,
      w: 23,
      h: 16,
      fill: "#ff2e88"
    },
    {
      t: "p",
      d: "M14 38A11.5 11.5 0 0 0 37 38Z",
      fill: "#ff2e88"
    },
    {
      t: "r",
      x: 37,
      y: 22,
      w: 23,
      h: 16,
      fill: "#f4f4f8"
    },
    {
      t: "p",
      d: "M37 38A11.5 11.5 0 0 0 60 38Z",
      fill: "#f4f4f8"
    },
    {
      t: "r",
      x: 60,
      y: 22,
      w: 23,
      h: 16,
      fill: "#ff2e88"
    },
    {
      t: "p",
      d: "M60 38A11.5 11.5 0 0 0 83 38Z",
      fill: "#ff2e88"
    },
    {
      t: "r",
      x: 83,
      y: 22,
      w: 23,
      h: 16,
      fill: "#f4f4f8"
    },
    {
      t: "p",
      d: "M83 38A11.5 11.5 0 0 0 106 38Z",
      fill: "#f4f4f8"
    },
    {
      t: "c",
      cx: 38,
      cy: 72,
      r: 8,
      fill: "#3ddc97"
    },
    {
      t: "c",
      cx: 55,
      cy: 71,
      r: 9,
      fill: "#ff2e88"
    },
    {
      t: "c",
      cx: 72,
      cy: 72,
      r: 8,
      fill: "#ff7a1a"
    },
    {
      t: "c",
      cx: 86,
      cy: 73,
      r: 6,
      fill: "#ffb020"
    },
    {
      t: "r",
      x: 14,
      y: 79,
      w: 92,
      h: 22,
      rx: 7,
      fill: "#ffb020"
    },
    {
      t: "p",
      d: "M24 90H96",
      stroke: "#e08f00",
      sw: 3,
      o: 0.6
    }
  ],
  gastronomia: [
    {
      t: "p",
      d: "M46 36Q40 28 46 20Q52 12 46 4M60 34Q54 26 60 18Q66 10 60 2M74 36Q68 28 74 20Q80 12 74 4",
      stroke: "#9b9bb0",
      sw: 4,
      o: 0.8
    },
    {
      t: "e",
      cx: 60,
      cy: 92,
      rx: 46,
      ry: 12,
      fill: "#f4f4f8"
    },
    {
      t: "e",
      cx: 60,
      cy: 90,
      rx: 34,
      ry: 7,
      fill: "#9b9bb0",
      o: 0.35
    },
    {
      t: "c",
      cx: 42,
      cy: 78,
      r: 15,
      fill: "#ffb020"
    },
    {
      t: "c",
      cx: 78,
      cy: 78,
      r: 15,
      fill: "#ffb020"
    },
    {
      t: "c",
      cx: 60,
      cy: 64,
      r: 16,
      fill: "#ffb020"
    },
    {
      t: "e",
      cx: 54,
      cy: 57,
      rx: 5,
      ry: 3.5,
      fill: "#f4f4f8",
      o: 0.6
    },
    {
      t: "e",
      cx: 37,
      cy: 72,
      rx: 4,
      ry: 3,
      fill: "#f4f4f8",
      o: 0.5
    },
    {
      t: "e",
      cx: 73,
      cy: 72,
      rx: 4,
      ry: 3,
      fill: "#f4f4f8",
      o: 0.5
    },
    {
      t: "c",
      cx: 66,
      cy: 70,
      r: 2.2,
      fill: "#e08f00"
    },
    {
      t: "c",
      cx: 48,
      cy: 84,
      r: 2.2,
      fill: "#e08f00"
    },
    {
      t: "c",
      cx: 84,
      cy: 84,
      r: 2.2,
      fill: "#e08f00"
    }
  ],
  outro: [
    {
      t: "p",
      d: "M60 26Q60 60 94 60Q60 60 60 94Q60 60 26 60Q60 60 60 26Z",
      fill: "#ff2e88"
    },
    {
      t: "p",
      d: "M94 13Q94 26 107 26Q94 26 94 39Q94 26 81 26Q94 26 94 13Z",
      fill: "#ffb020"
    },
    {
      t: "p",
      d: "M26 81Q26 92 37 92Q26 92 26 103Q26 92 15 92Q26 92 26 81Z",
      fill: "#3ddc97"
    },
    {
      t: "c",
      cx: 97,
      cy: 92,
      r: 5,
      fill: "#ff7a1a"
    },
    {
      t: "c",
      cx: 24,
      cy: 30,
      r: 4,
      fill: "#f4f4f8"
    }
  ]
};

/** Cor de fundo da capa de cada categoria */
export const ART_BG: Record<Category, string> = {
  festa: "#3a1030",
  show: "#2a1640",
  pelada: "#0f2e22",
  esporte: "#0e2a33",
  feira: "#33240c",
  gastronomia: "#36200e",
  outro: "#22222f",
};

/** SVG em texto (pinos do mapa, imagens de prévia) */
export function illustrationSvg(c: Category, size = 120, withBg = false) {
  const el = (s: Shape) => {
    const op = s.o !== undefined ? ` opacity="${s.o}"` : "";
    if (s.t === "c") return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}"${op}/>`;
    if (s.t === "e") return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${s.fill}"${op}/>`;
    if (s.t === "r") return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx ?? 0}" fill="${s.fill}"${op}/>`;
    return s.stroke
      ? `<path d="${s.d}" fill="none" stroke="${s.stroke}" stroke-width="${s.sw ?? 4}" stroke-linecap="round" stroke-linejoin="round"${op}/>`
      : `<path d="${s.d}" fill="${s.fill}"${op}/>`;
  };
  const bg = withBg ? `<rect width="120" height="120" rx="28" fill="${ART_BG[c]}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">${bg}${(ILLUSTRATIONS[c] ?? ILLUSTRATIONS.outro).map(el).join("")}</svg>`;
}
