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

export type Plan = "gratis" | "destaque" | "role_da_noite";
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

export const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: "festa", label: "Festa", emoji: "🪩", color: "#ff2e88" },
  { id: "show", label: "Show", emoji: "🎤", color: "#a855f7" },
  { id: "pelada", label: "Pelada", emoji: "⚽", color: "#22c55e" },
  { id: "esporte", label: "Esporte", emoji: "🏃", color: "#06b6d4" },
  { id: "feira", label: "Feira", emoji: "🛍️", color: "#f59e0b" },
  { id: "gastronomia", label: "Gastronomia", emoji: "🧀", color: "#f97316" },
  { id: "outro", label: "Outro", emoji: "✨", color: "#94a3b8" },
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

/** Plano do evento (antes do 014 só existia "featured") */
export function planOf(e: { plan?: Plan; featured?: boolean }): Plan {
  return e.plan ?? (e.featured ? "role_da_noite" : "gratis");
}
export const PLAN_RANK: Record<Plan, number> = { gratis: 0, destaque: 1, role_da_noite: 2 };
export const PLAN_LABEL: Record<Plan, string> = { gratis: "Grátis", destaque: "Destaque", role_da_noite: "Rolê da noite" };

/** Faixa de preço do evento (ou a do local) */
export function priceLevelOf(e: { price_level?: PriceLevel | null; venue?: { price_level?: PriceLevel | null } | null }) {
  return (e.price_level ?? e.venue?.price_level ?? null) as PriceLevel | null;
}
export const PRICE_LEVELS: { id: PriceLevel; label: string; hint: string }[] = [
  { id: 1, label: "$", hint: "barato" },
  { id: 2, label: "$$", hint: "médio" },
  { id: 3, label: "$$$", hint: "caro" },
];
