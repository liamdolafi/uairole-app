// Ícones de traço do app: todos do lucide-react-native, mesma espessura (2) em todo lugar.
// Tamanhos: 16 no meio do texto, 18 em botões, 22 na barra de baixo.
import type { LucideIcon, LucideProps } from "lucide-react-native";
import { Disc3, Goal, MicVocal, Sparkles, Store, Trophy, Utensils } from "lucide-react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { ART_BG, ILLUSTRATIONS, type Shape } from "@/lib/illustrations";
import { C } from "@/lib/theme";
import type { Category } from "@/lib/types";

export const STROKE = 2;

/** Ícone com o padrão do app. Sem `label` ele é decorativo. */
export function Icon({ icon: I, size = 16, color = C.ink, label, ...rest }: LucideProps & { icon: LucideIcon; label?: string }) {
  return (
    <I
      size={size}
      color={color}
      strokeWidth={STROKE}
      accessible={!!label}
      accessibilityLabel={label}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
      {...rest}
    />
  );
}

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  festa: Disc3,
  show: MicVocal,
  pelada: Goal,
  esporte: Trophy,
  feira: Store,
  gastronomia: Utensils,
  outro: Sparkles,
};

/** Holofote (desenho próprio no estilo do lucide: traço 2, cantos redondos) */
export function HolofoteIcon({ size = 16, color = C.ink }: { size?: number; color?: string }) {
  const p = { stroke: color, strokeWidth: STROKE, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.5 13.5 9 9l6.5 6.5L11 20Z" {...p} />
      <Path d="m9 9 2.5-2.5a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L15 15" {...p} />
      <Path d="M7.5 18.5 4 22" {...p} />
      <Path d="M17 3.5 18 2M20.5 7 22 6M19.5 4.5 21 3" {...p} />
    </Svg>
  );
}

function El({ s }: { s: Shape }) {
  const o = s.o;
  if (s.t === "c") return <Circle cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity={o} />;
  if (s.t === "e") return <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill} opacity={o} />;
  if (s.t === "r") return <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={s.fill} opacity={o} />;
  return s.stroke ? (
    <Path d={s.d} fill="none" stroke={s.stroke} strokeWidth={s.sw ?? 4} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
  ) : (
    <Path d={s.d} fill={s.fill} opacity={o} />
  );
}

/** Ilustração da categoria (desenho próprio, igual ao site) */
export function CategoryArt({ category, size = 120, bg = false }: { category: Category; size?: number; bg?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {bg ? <Rect width={120} height={120} rx={28} fill={ART_BG[category]} /> : null}
      {(ILLUSTRATIONS[category] ?? ILLUSTRATIONS.outro).map((s, i) => (
        <El key={i} s={s} />
      ))}
    </Svg>
  );
}
