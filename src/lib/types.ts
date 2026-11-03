// Copiado do site (../uairole/lib/types.ts). Mantenha os dois iguais.
export type Role = "usuario" | "organizador" | "admin" | "socio";
export type Category =
  | "festa"
  | "show"
  | "pelada"
  | "esporte"
  | "feira"
  | "gastronomia"
  | "outro";
export type AgeRating = "livre" | "16" | "18";

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  role: Role;
  organizer_request: boolean;
  created_at: string;
  home_neighborhood?: string | null;
  share_going?: boolean;
  share_checkins?: boolean;
  is_test?: boolean;
  brought_by_partner?: string | null;
  brought_at?: string | null;
  organizer_plan?: Plan;
};

/** "holofote" se chamava "role_da_noite" antes do 025 */
export type Plan = "gratis" | "destaque" | "holofote";
export type PriceLevel = 1 | 2 | 3;

export type Venue = {
  id: string;
  owner_id: string | null;
  name: string;
  address: string | null;
  neighborhood: string;
  lat: number;
  lng: number;
  archived: boolean;
  is_sample?: boolean;
  price_level?: PriceLevel | null;
};

export type EventRow = {
  id: string;
  venue_id: string;
  organizer_id: string | null;
  title: string;
  description: string | null;
  category: Category;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  ticket_url: string | null;
  cover_url: string | null;
  age_rating: AgeRating;
  featured: boolean;
  status: "ativo" | "cancelado";
  views: number;
  created_at: string;
  series_id?: string | null;
  is_sample?: boolean;
  plan?: Plan;
  price_level?: PriceLevel | null;
  push_sent_at?: string | null;
  // preço em números (025)
  is_free?: boolean;
  price_min_cents?: number | null;
  price_max_cents?: number | null;
  price_review?: boolean;
};

export type Series = { freq: "semanal" | "mensal"; weekdays: number[] | null; until: string | null };

export type EventWithVenue = EventRow & { venue: Venue; series?: Series | null };

export type Thermo = {
  event_id: string;
  score: number; // 0–100
  crowd: number;
  music: number;
  vibe: number;
  checkins: number;
};

export const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: "festa", label: "Festa", color: "#ff2e88" },
  { id: "show", label: "Show", color: "#b57bff" },
  { id: "pelada", label: "Pelada", color: "#3ddc97" },
  { id: "esporte", label: "Esporte", color: "#22c3e6" },
  { id: "feira", label: "Feira", color: "#ffb020" },
  { id: "gastronomia", label: "Gastronomia", color: "#ff7a1a" },
  { id: "outro", label: "Outro", color: "#a3a3b8" },
];

export function categoryInfo(c: Category) {
  return CATEGORIES.find((x) => x.id === c) ?? CATEGORIES[CATEGORIES.length - 1];
}

export const AGE_LABEL: Record<AgeRating, string> = {
  livre: "Livre",
  "16": "16+",
  "18": "18+",
};

export const EVENT_SELECT = "*, venue:venues(*)";
// com a série (precisa do 009_recorrencia.sql)
export const EVENT_SELECT_FULL = "*, venue:venues(*), series:event_series(freq,weekdays,until)";

export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function seriesLabel(s?: Series | null) {
  if (!s) return "";
  if (s.freq === "mensal") return "Todo mês";
  const days = (s.weekdays ?? []).slice().sort().map((d) => WEEKDAYS[d]);
  return days.length === 7 ? "Todo dia" : `Toda semana (${days.join(", ")})`;
}

/** Plano do evento (antes do 014 só existia "featured"; antes do 025 o Holofote era "role_da_noite") */
export function planOf(e: { plan?: Plan | "role_da_noite"; featured?: boolean }): Plan {
  if (e.plan === "role_da_noite") return "holofote";
  return e.plan ?? (e.featured ? "holofote" : "gratis");
}
export const PLAN_RANK: Record<Plan, number> = { gratis: 0, destaque: 1, holofote: 2 };
export const PLAN_LABEL: Record<Plan, string> = { gratis: "Grátis", destaque: "Destaque", holofote: "Holofote" };

/** Preço do evento em centavos. Funciona antes e depois do 025. */
export function eventPrice(e: Pick<EventRow, "price_cents" | "price_level" | "is_free" | "price_min_cents" | "price_max_cents" | "price_review">) {
  const has025 = e.is_free !== undefined;
  const free = has025 ? !!e.is_free : !e.price_cents && !e.price_level;
  const min = free ? 0 : has025 ? (e.price_min_cents ?? null) : e.price_cents || null;
  const max = free ? 0 : (e.price_max_cents ?? null);
  return { free, min, max, review: !!e.price_review };
}

const reais = (c: number) =>
  "R$ " + (c % 100 ? (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(c / 100));

/** "Grátis", "R$ 25", "R$ 25 a R$ 60" ou "Preço a confirmar" */
export function priceLabel(e: Parameters<typeof eventPrice>[0]) {
  const p = eventPrice(e);
  if (p.free) return "Grátis";
  if (p.min === null) return "Preço a confirmar";
  return p.max && p.max > p.min ? `${reais(p.min)} a ${reais(p.max)}` : reais(p.min);
}

/** Faixa $/$$/$$$ a partir do preço: até R$ 30, até R$ 80, acima (igual ao banco) */
export function levelFromCents(c: number | null): PriceLevel | null {
  if (!c) return null;
  return c <= 3000 ? 1 : c <= 8000 ? 2 : 3;
}

/** Faixa de preço do evento (calculada pelo preço; se não tiver preço, a marcada no evento ou no local) */
export function priceLevelOf(e: Parameters<typeof eventPrice>[0] & { venue?: { price_level?: PriceLevel | null } | null }) {
  const p = eventPrice(e);
  if (p.free) return null;
  return levelFromCents(p.min) ?? ((e.price_level ?? e.venue?.price_level ?? null) as PriceLevel | null);
}
export const PRICE_LEVELS: { id: PriceLevel; label: string; hint: string }[] = [
  { id: 1, label: "$", hint: "até R$ 30" },
  { id: 2, label: "$$", hint: "até R$ 80" },
  { id: 3, label: "$$$", hint: "acima de R$ 80" },
];
