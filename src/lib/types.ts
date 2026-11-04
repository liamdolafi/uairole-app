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
  /** 027: "Vender pelo Uai Rolê" */
  sells_tickets?: boolean;
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

/** Período do plano (026): "só este evento" (até o fim daquele evento) ou mensal (30 dias, todos os eventos) */
export type PlanPeriod = "evento" | "mensal";
export const PERIOD_LABEL: Record<PlanPeriod, string> = { evento: "Só este evento", mensal: "Mensal" };

/** Preços dos planos e vagas da oferta de lançamento (função public_plan_info do 026) */
export type PlanInfo = {
  destaque_evento: number;
  destaque_mensal: number;
  holofote_evento: number;
  holofote_mensal: number;
  launch_slots: number;
  launch_remaining: number;
};
/** Usado enquanto carrega (ou se o 026 ainda não rodou: aí a oferta não aparece) */
export const DEFAULT_PLAN_INFO: PlanInfo = {
  destaque_evento: 2900,
  destaque_mensal: 7900,
  holofote_evento: 6900,
  holofote_mensal: 19900,
  launch_slots: 20,
  launch_remaining: 0,
};
export function planPrice(info: PlanInfo, plan: Exclude<Plan, "gratis">, period: PlanPeriod) {
  return info[`${plan}_${period}`];
}

/** Pedido de plano (o organizador pede, o admin ativa) */
export type PlanRequest = {
  id: string;
  organizer_id: string;
  event_id: string | null;
  plan: Exclude<Plan, "gratis">;
  period: PlanPeriod;
  status: "pendente" | "ativado" | "recusado" | "cancelado";
  note: string | null;
  created_at: string;
  handled_at: string | null;
};

/** Plano ativado. No mensal, cada mês é uma linha (a renovação cria a próxima). */
export type PlanSubscription = {
  id: string;
  organizer_id: string | null;
  event_id: string | null;
  plan: Exclude<Plan, "gratis">;
  period: PlanPeriod;
  starts_at: string;
  ends_at: string;
  amount_cents: number;
  note: string | null;
  auto_renew: boolean;
  launch_offer: boolean;
  status: "ativo" | "cancelado";
  renewed_from: string | null;
  renewed_at: string | null;
  is_test?: boolean;
  created_at: string;
};

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

// ===== Pagamentos e ingressos (027) =====
export type PaymentMethod = "pix" | "cartao";
export type PaymentStatus = "pendente" | "pago" | "recusado" | "expirado" | "reembolsado" | "cancelado";
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pendente: "Esperando o pagamento",
  pago: "Pago",
  recusado: "Pagamento recusado",
  expirado: "Prazo acabou",
  reembolsado: "Reembolsado",
  cancelado: "Cancelado",
};
export type Payment = {
  id: string;
  kind: "plano" | "ingresso";
  event_id: string | null;
  plan: Plan | null;
  period: PlanPeriod | null;
  subtotal_cents: number;
  fee_cents: number;
  amount_cents: number;
  method: PaymentMethod | "gratis" | null;
  status: PaymentStatus;
  description: string;
  pix_qr: string | null;
  pix_qr_base64: string | null;
  checkout_url: string | null;
  expires_at: string;
  paid_at: string | null;
  is_test: boolean;
  created_at: string;
};

/** O que está à venda num evento (função ticket_availability) */
export type TicketTypeOnSale = {
  id: string;
  name: string;
  description: string | null;
  allow_half: boolean;
  per_person_limit: number;
  sales_end_at: string | null;
  on_sale: boolean;
  lot: { id: string; name: string; price_cents: number; remaining: number; ends_at: string | null } | null;
};
export type TicketAvailability = {
  sells: boolean;
  open?: boolean;
  /** vendia, mas o plano acabou: vendas novas pausadas (030) */
  paused?: boolean;
  connected?: boolean;
  age_blocked?: boolean;
  fee_rate?: number;
  types?: TicketTypeOnSale[];
};

/** Pode vender ingressos pelo Uai Rolê? (função ticket_sales_status, 030) */
export type TicketSalesStatus = {
  allowed: boolean;
  plan: Plan;
  /** evento que já vendia antes da regra nova: continua vendendo até acabar */
  legacy: boolean;
  sells: boolean;
  /** vendia, mas o plano acabou */
  paused: boolean;
  until: string | null;
  /** link de ingresso próprio liberado? (031) */
  link_allowed?: boolean;
  /** evento que já tinha link antes da regra nova: continua até o fim */
  link_legacy?: boolean;
  /** tinha link, mas o plano acabou: o link saiu da página */
  link_paused?: boolean;
};
/** Ingresso (venda pelo Uai Rolê ou link próprio) é dos planos pagos (030 e 031) */
export const TICKET_PLAN_BADGE = "Destaque ou Holofote";
export const TICKET_PLAN_EXPLAIN =
  "Ingresso é dos planos Destaque e Holofote: tanto a venda pelo Uai Rolê quanto o link de ingresso próprio. Ative um plano pra este evento (ou o mensal) e libera na hora.";
export const TICKET_LINK_PAUSED_EXPLAIN =
  "O plano deste evento acabou, então o link de ingresso saiu da página do evento (ele continua salvo). Renove e o link volta sozinho.";
export const TICKET_PAUSED_EXPLAIN =
  "O plano deste evento acabou, então as vendas novas estão pausadas e o botão de comprar sumiu. Os ingressos vendidos continuam valendo e entram normalmente no leitor. Renove e as vendas voltam sozinhas.";

/** Tipos e lotes (painel do organizador) */
export type TicketLot = { id: string; type_id: string; name: string; price_cents: number; quantity: number; ends_at: string | null; sort: number };
export type TicketType = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  allow_half: boolean;
  per_person_limit: number;
  sales_end_at: string | null;
  sort: number;
  active: boolean;
  lots?: TicketLot[];
};

export type TicketStatus = "valido" | "usado" | "cancelado" | "reembolsado";
export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = { valido: "Válido", usado: "Usado", cancelado: "Cancelado", reembolsado: "Reembolsado" };
export type MyTicket = {
  id: string;
  code: string;
  half: boolean;
  status: TicketStatus;
  used_at: string | null;
  price_cents: number;
  event: { id: string; title: string; starts_at: string; ends_at: string; venue: { name: string; neighborhood: string } | null } | null;
  type: { name: string } | null;
};

/** Resultado da leitura do QR na entrada */
export type ValidateResult = {
  ok: boolean;
  status: "ok" | "usado" | "cancelado" | "reembolsado" | "nao_encontrado" | "sem_permissao" | "outro_evento";
  type_name?: string;
  half?: boolean;
  owner?: string;
  used_at?: string;
  event_title?: string;
};
export const VALIDATE_LABEL: Record<ValidateResult["status"], string> = {
  ok: "Entrada liberada",
  usado: "Ingresso já usado",
  cancelado: "Ingresso cancelado",
  reembolsado: "Ingresso reembolsado",
  nao_encontrado: "Ingresso não encontrado",
  sem_permissao: "Esse ingresso não é de um evento seu",
  outro_evento: "Ingresso de outro evento",
};

export type EventSales = {
  tickets_sold: number;
  tickets_used: number;
  gross_cents: number;
  fee_cents: number;
  refunded_cents: number;
  by_type: { name: string; sold: number; used: number }[];
  orders: { id: string; buyer: string; status: PaymentStatus; method: string; subtotal_cents: number; paid_at: string | null; qty: number }[];
};

/** Preço de um ingresso (meia = metade, arredondando pra cima, igual ao banco) */
export const ticketUnitPrice = (price: number, half: boolean) => (half ? Math.ceil(price / 2) : price);
/** Taxa de serviço (igual ao banco: arredonda pro centavo) */
export const serviceFee = (subtotal: number, rate: number) => Math.round(subtotal * rate);

// ===== Avisos (028) =====
export type NotificationKind = "amizade" | "holofote" | "plano" | "ingresso" | "lembrete" | "socio";
export type NotificationPrefs = Record<NotificationKind, boolean>;
export const NOTIFICATION_KINDS: { id: NotificationKind; label: string; hint: string; only?: "organizador" | "socio" }[] = [
  { id: "amizade", label: "Amizades", hint: "Pedido de amizade e amizade aceita." },
  { id: "holofote", label: "Holofote", hint: "Rolês com Holofote dos locais e organizadores que você segue e das categorias que você curte." },
  { id: "lembrete", label: "Lembrete do dia", hint: "No dia do rolê em que você tem ingresso ou clicou “Eu vou”." },
  { id: "ingresso", label: "Ingressos", hint: "Compra confirmada, reembolso e evento cancelado." },
  { id: "plano", label: "Planos", hint: "Plano ativado, renovado ou perto de acabar.", only: "organizador" },
  { id: "socio", label: "Sócio", hint: "Comissões, metas e pagamentos.", only: "socio" },
];
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { amizade: true, holofote: true, plano: true, ingresso: true, lembrete: true, socio: true };

/** Configuração pública (função app_config do 027) */
export type AppConfig = { ticket_fee_rate: number; plan_purchase_ios: boolean; plan_purchase_android: boolean };
export const DEFAULT_APP_CONFIG: AppConfig = { ticket_fee_rate: 0.08, plan_purchase_ios: false, plan_purchase_android: false };

// ===== O que cada plano inclui (igual no site e no app) =====
export const PLAN_FEATURES: Record<Plan, string[]> = {
  gratis: [
    "Local e eventos ilimitados no app e no mapa",
    "Página do local com preços e cardápio",
    "“Eu vou”, check-ins e termômetro ao vivo",
    "Números básicos de cada evento: visualizações, “Eu vou” e check-ins",
  ],
  destaque: [
    "Tudo do Grátis",
    "Venda de ingressos pelo Uai Rolê (Pix e cartão, QR code na entrada)",
    "Link de ingresso próprio (Sympla, site do evento...)",
    "Aparece no topo da lista",
    "Selo Destaque no card",
    "Pino maior no mapa",
  ],
  holofote: [
    "Tudo do Destaque",
    "Venda de ingressos pelo Uai Rolê (Pix e cartão, QR code na entrada)",
    "Link de ingresso próprio (Sympla, site do evento...)",
    "Selo Holofote e primeiro lugar da lista",
    "Carrossel “Em destaque” no topo da Descobrir, de hoje e dos próximos dias",
    "Pino maior e com brilho no mapa",
    "Notificação para os seguidores do local e para quem curte a categoria",
    "Post fixado no topo do Feed",
    "Estatísticas avançadas: visualizações por hora, bairros do público (anônimo) e cliques em “Como chegar” e no ingresso",
  ],
};

/** Escolha na página de pagamento: Pix, cartão de crédito ou cartão de débito */
export type PayChoice = "pix" | "credito" | "debito";
export const PAY_CHOICE_LABEL: Record<PayChoice, string> = { pix: "Pix", credito: "Cartão de crédito", debito: "Cartão de débito" };
/** Mensagem quando o pagamento online ainda não está liberado */
export const PAYMENT_SOON_MESSAGE = "O pagamento online chega em breve. Fale com a gente para ativar seu plano agora.";

// ===== 033: sugestões, "Este local é meu", Em alta e indicações =====
export type RequestStatus = "pendente" | "aprovada" | "recusada";
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = { pendente: "Em análise", aprovada: "Aprovada", recusada: "Recusada" };

export type EventSuggestion = {
  id: string;
  user_id: string;
  title: string;
  starts_at: string;
  place: string;
  neighborhood: string;
  category: Category;
  is_free: boolean;
  price_cents: number | null;
  age_rating: AgeRating;
  source_url: string | null;
  status: RequestStatus;
  event_id: string | null;
  admin_note: string | null;
  created_at: string;
  handled_at: string | null;
};
export const SUGGESTIONS_PER_DAY = 5;
export type SuggestionDuplicate = { kind: "evento" | "sugestao"; id: string; title: string; place: string; starts_at: string };

export type ClaimJob = "dono" | "gerente" | "produtor";
export const CLAIM_JOBS: { id: ClaimJob; label: string }[] = [
  { id: "dono", label: "Dono" },
  { id: "gerente", label: "Gerente" },
  { id: "produtor", label: "Produtor" },
];
export type VenueClaim = {
  id: string;
  venue_id: string;
  user_id: string;
  contact_name: string;
  job: ClaimJob;
  contact: string;
  instagram: string | null;
  status: RequestStatus;
  admin_note: string | null;
  moved_events: number | null;
  created_at: string;
  handled_at: string | null;
  handled_by: string | null;
};

export type TrendingRow = { event_id: string; score: number; filler: boolean };

/** "Ana te chamou pra esse rolê" (menor de 18 ou sem nome: "Um amigo") */
export function inviteText(firstName: string | null | undefined) {
  return `${firstName?.trim() || "Um amigo"} te chamou pra esse rolê`;
}
/** Link com o código de indicação de quem compartilha */
export function withRef(path: string, code?: string | null) {
  if (!code) return path;
  return `${path}${path.includes("?") ? "&" : "?"}ref=${encodeURIComponent(code)}`;
}
export const REF_CODE_RE = /^[a-z0-9]{8}$/;
