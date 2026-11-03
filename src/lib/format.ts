// Copiado do site (../uairole/lib/format.ts), com ajustes pro app.
// Tudo no fuso de BH (America/Sao_Paulo, UTC-3 sem horário de verão)
export const TZ = "America/Sao_Paulo";

const dayFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  weekday: "short",
  day: "2-digit",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "2026-11-01" no fuso de BH */
export function ymd(d: Date) {
  return ymdFmt.format(d);
}

/** Início do dia (00:00 em BH) de uma data "YYYY-MM-DD" */
export function startOfDayBH(dateStr: string) {
  return new Date(`${dateStr}T00:00:00-03:00`);
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 86400000);
}

export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

export function formatWhen(startIso: string, endIso: string, now = new Date()) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (s <= now && now < e) return `Rolando agora · até ${formatTime(endIso)}`;
  const today = ymd(now);
  const tomorrow = ymd(addDays(now, 1));
  const day = ymd(s);
  const label =
    day === today ? "Hoje" : day === tomorrow ? "Amanhã" : dayFmt.format(s).replace(".", "");
  return `${label} · ${formatTime(startIso)}`;
}

export function formatDateLong(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatPrice(cents: number) {
  if (!cents) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Valor em reais sem centavos quando é redondo: "R$ 79", "R$ 59,70" */
export function formatReais(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** Dia e mês em BH: "03/12" */
export function formatDayMonth(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

export function isLive(startIso: string, endIso: string, now = new Date()) {
  return new Date(startIso) <= now && now < new Date(endIso);
}

export function ageFromBirth(birth: string, now = new Date()) {
  const [y, m, d] = birth.split("-").map(Number);
  const [ty, tm, td] = ymd(now).split("-").map(Number);
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age--;
  return age;
}

/** Mensagem de erro amigável */
export function errMsg(e: unknown) {
  const m =
    typeof e === "object" && e && "message" in e ? String((e as { message: string }).message) : String(e);
  if (/Failed to fetch|NetworkError|fetch failed|Network request failed/i.test(m)) return "Sem conexão. Confere sua internet e tenta de novo.";
  if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(m)) return "Confirma seu e-mail antes de entrar com o código que enviamos.";
  if (/only request this after (\d+) seconds?/i.test(m))
    return `Espera ${m.match(/after (\d+) seconds?/i)?.[1]} segundos pra pedir de novo.`;
  if (/User already registered/i.test(m)) return "Esse e-mail já tem conta. Tenta entrar.";
  if (/Password should be/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/rate limit/i.test(m)) return "Muitas tentativas. Espera um pouquinho e tenta de novo.";
  if (/row-level security|permission denied/i.test(m)) return "Você não tem permissão pra fazer isso.";
  if (/Faltam as chaves/i.test(m)) return m;
  return m || "Deu ruim aqui. Tenta de novo.";
}

/** Tira acentos e deixa minúsculo (pra busca) */
export function normalizeSearch(t: string) {
  return t.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** "31/12/2008" → "2008-12-31" (ou null se a data não existe) */
export function brDateToIso(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo}-${d}`;
  const dt = new Date(`${iso}T12:00:00Z`);
  if (isNaN(dt.getTime()) || dt.getUTCDate() !== Number(d) || dt.getUTCMonth() + 1 !== Number(mo)) return null;
  return iso;
}
