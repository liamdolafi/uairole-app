// Filtros da Descobrir e do Mapa (os mesmos no site e no app).
// O mesmo arquivo existe no site (lib/filters.ts) e no app (src/lib/filters.ts): se mudar um, mude o outro.
// A regra de idade continua no banco (RLS): o filtro de idade é só a escolha de quem usa.
import { addDays, startOfDayBH, ymd } from "./format";
import { eventPrice, planOf, PLAN_RANK, type AgeRating, type Category, type EventWithVenue, type Thermo } from "./types";

export type When = "tudo" | "agora" | "hoje" | "amanha" | "fds" | "datas";
export type SortBy = "alta" | "perto" | "barato" | "data";

export type Filters = {
  when: When;
  from: string; // "YYYY-MM-DD" (só quando when = "datas")
  to: string;
  cats: Category[];
  hood: string;
  priceMin: number; // reais, 0 a 300 (de 10 em 10)
  priceMax: number; // 300 = "R$ 300+" (sem limite)
  onlyFree: boolean;
  ages: AgeRating[]; // vazio = todas que a pessoa pode ver
  distanceKm: number; // 0 = qualquer distância; 1 a 30
  sort: SortBy;
};

export const PRICE_MAX = 300;
export const PRICE_STEP = 10;
export const DIST_MAX = 30;

export const DEFAULT_FILTERS: Filters = {
  when: "tudo",
  from: "",
  to: "",
  cats: [],
  hood: "",
  priceMin: 0,
  priceMax: PRICE_MAX,
  onlyFree: false,
  ages: [],
  distanceKm: 0,
  sort: "alta",
};

export const WHEN_OPTIONS: { id: When; label: string }[] = [
  { id: "tudo", label: "Qualquer dia" },
  { id: "agora", label: "Agora" },
  { id: "hoje", label: "Hoje" },
  { id: "amanha", label: "Amanhã" },
  { id: "fds", label: "Fim de semana" },
  { id: "datas", label: "Escolher datas" },
];

export const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: "alta", label: "Em alta" },
  { id: "perto", label: "Mais perto" },
  { id: "barato", label: "Mais barato" },
  { id: "data", label: "Data" },
];

export const AGE_OPTIONS: { id: AgeRating; label: string }[] = [
  { id: "livre", label: "Livre" },
  { id: "16", label: "16+" },
  { id: "18", label: "18+" },
];

/** Classificações que a pessoa pode ver (visitante, sem data ou menor de 16: só Livre) */
export function allowedAges(age: number | null | undefined): AgeRating[] {
  if (age === null || age === undefined || age < 16) return ["livre"];
  if (age < 18) return ["livre", "16"];
  return ["livre", "16", "18"];
}

/** Lê o que estava salvo no aparelho, sem confiar em nada */
export function sanitizeFilters(raw: unknown): Filters {
  const f = { ...DEFAULT_FILTERS };
  if (!raw || typeof raw !== "object") return f;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number, d: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : d;
  const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (WHEN_OPTIONS.some((o) => o.id === r.when)) f.when = r.when as When;
  if (isDate(r.from)) f.from = r.from as string;
  if (isDate(r.to)) f.to = r.to as string;
  if (f.when === "datas" && !f.from) f.when = "tudo";
  if (Array.isArray(r.cats)) f.cats = r.cats.filter((c): c is Category => typeof c === "string").slice(0, 7);
  if (typeof r.hood === "string") f.hood = r.hood.slice(0, 60);
  f.priceMin = num(r.priceMin, 0, PRICE_MAX, 0);
  f.priceMax = num(r.priceMax, 0, PRICE_MAX, PRICE_MAX);
  if (f.priceMin > f.priceMax) [f.priceMin, f.priceMax] = [f.priceMax, f.priceMin];
  f.onlyFree = r.onlyFree === true;
  if (Array.isArray(r.ages)) f.ages = r.ages.filter((a): a is AgeRating => a === "livre" || a === "16" || a === "18");
  f.distanceKm = num(r.distanceKm, 0, DIST_MAX, 0);
  if (SORT_OPTIONS.some((o) => o.id === r.sort)) f.sort = r.sort as SortBy;
  return f;
}

/** Quantos filtros estão ligados (a ordem não conta) */
export function countActive(f: Filters) {
  return (
    (f.when !== "tudo" ? 1 : 0) +
    (f.cats.length ? 1 : 0) +
    (f.hood ? 1 : 0) +
    (f.onlyFree || f.priceMin > 0 || f.priceMax < PRICE_MAX ? 1 : 0) +
    (f.ages.length ? 1 : 0) +
    (f.distanceKm ? 1 : 0)
  );
}

export function priceRangeLabel(f: Filters) {
  if (f.onlyFree) return "Só grátis";
  const max = f.priceMax >= PRICE_MAX ? `R$ ${PRICE_MAX}+` : `R$ ${f.priceMax}`;
  return `R$ ${f.priceMin} a ${max}`;
}

/** Distância em km entre dois pontos */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function formatKm(km: number) {
  return km < 1 ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;
}

/** O evento acontece (pelo menos em parte) dentro da janela escolhida? */
export function matchesWhen(e: { starts_at: string; ends_at: string }, f: Pick<Filters, "when" | "from" | "to">, now = new Date()) {
  if (f.when === "tudo") return true;
  const s = new Date(e.starts_at).getTime();
  const end = new Date(e.ends_at).getTime();
  const n = now.getTime();
  if (f.when === "agora") return s <= n && n < end;
  const today = startOfDayBH(ymd(now));
  let from: Date;
  let to: Date;
  if (f.when === "hoje") {
    from = today;
    to = addDays(today, 1);
  } else if (f.when === "amanha") {
    from = addDays(today, 1);
    to = addDays(today, 2);
  } else if (f.when === "datas") {
    from = startOfDayBH(f.from || ymd(now));
    to = addDays(startOfDayBH(f.to && f.to >= f.from ? f.to : f.from || ymd(now)), 1);
  } else {
    // fim de semana: sexta 18h até domingo 23h59 (dia da semana em BH, 0 = domingo)
    const dow = new Date(`${ymd(now)}T12:00:00-03:00`).getUTCDay();
    const toFri = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow;
    from = new Date(addDays(today, toFri).getTime() + 18 * 3600000);
    to = addDays(today, toFri + 3);
  }
  return s < to.getTime() && end > Math.max(from.getTime(), n);
}

/** Pontuação de "Em alta": termômetro ao vivo + Holofote/Destaque + visualizações */
export function hotScore(e: EventWithVenue, thermo?: Thermo) {
  return (thermo?.score ?? 0) + PLAN_RANK[planOf(e)] * 15 + Math.log1p(e.views ?? 0) * 8;
}

export type FilterContext = {
  pos?: { lat: number; lng: number } | null;
  thermo?: Record<string, Thermo>;
  q?: string;
  now?: Date;
};

const norm = (t: string) => t.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Aplica os filtros e a ordem escolhida */
export function applyFilters(events: EventWithVenue[], f: Filters, ctx: FilterContext = {}) {
  const now = ctx.now ?? new Date();
  const term = norm(ctx.q?.trim() ?? "");
  const priceOn = f.onlyFree || f.priceMin > 0 || f.priceMax < PRICE_MAX;
  const maxCents = f.priceMax >= PRICE_MAX ? Infinity : f.priceMax * 100;
  const pos = ctx.pos ?? null;
  const dist = (e: EventWithVenue) => (pos && e.venue ? distanceKm(pos, e.venue) : null);

  const list = events.filter((e) => {
    if (!matchesWhen(e, f, now)) return false;
    if (f.cats.length && !f.cats.includes(e.category)) return false;
    if (f.hood && e.venue?.neighborhood !== f.hood) return false;
    if (f.ages.length && !f.ages.includes(e.age_rating)) return false;
    if (priceOn) {
      const p = eventPrice(e);
      if (f.onlyFree) {
        if (!p.free) return false;
      } else {
        if (p.min === null) return false; // preço a confirmar não entra quando filtra por preço
        const lo = p.min;
        const hi = p.max && p.max > lo ? p.max : lo;
        if (lo > maxCents || hi < f.priceMin * 100) return false;
      }
    }
    if (f.distanceKm && pos) {
      const d = dist(e);
      if (d === null || d > f.distanceKm) return false;
    }
    if (term && !norm(`${e.title} ${e.venue?.name ?? ""} ${e.venue?.neighborhood ?? ""}`).includes(term)) return false;
    return true;
  });

  const byDate = (a: EventWithVenue, b: EventWithVenue) => a.starts_at.localeCompare(b.starts_at);
  const sorters: Record<SortBy, (a: EventWithVenue, b: EventWithVenue) => number> = {
    alta: (a, b) => hotScore(b, ctx.thermo?.[b.id]) - hotScore(a, ctx.thermo?.[a.id]) || byDate(a, b),
    perto: (a, b) => (dist(a) ?? Infinity) - (dist(b) ?? Infinity) || byDate(a, b),
    barato: (a, b) => (eventPrice(a).min ?? Infinity) - (eventPrice(b).min ?? Infinity) || byDate(a, b),
    data: byDate,
  };
  const sort = f.sort === "perto" && !pos ? "data" : f.sort;
  return list.sort(sorters[sort]);
}

/** Eventos com Holofote de hoje e dos próximos dias (carrossel "Em destaque") */
export function spotlightEvents(events: EventWithVenue[], days = 7, now = new Date()) {
  const until = addDays(startOfDayBH(ymd(now)), days + 1).getTime();
  return events
    .filter((e) => planOf(e) === "holofote" && new Date(e.ends_at).getTime() > now.getTime() && new Date(e.starts_at).getTime() < until)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
