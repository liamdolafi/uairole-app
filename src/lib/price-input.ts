// Mesmas regras do site (../uairole/components/painel/price-fields.tsx)
export type PriceState = { free: boolean; min: string; max: string };

/** "25", "25,50", "1.200" → centavos (null = vazio, NaN = inválido) */
export function parseReais(v: string): number | null {
  const t = v.trim().replace(/^R\$\s*/i, "");
  if (!t) return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

export const reaisInput = (c: number | null | undefined) => (c ? (c / 100).toFixed(2).replace(".", ",").replace(",00", "") : "");

/** Valida e devolve o que vai pro banco (ou uma mensagem de erro) */
export function priceToPayload(p: PriceState): { error: string } | { is_free: boolean; price_min_cents: number | null; price_max_cents: number | null; price_cents: number } {
  if (p.free) return { is_free: true, price_min_cents: null, price_max_cents: null, price_cents: 0 };
  const min = parseReais(p.min);
  const max = parseReais(p.max);
  if (min === null) return { error: "Coloca o preço (a partir de quanto) ou marca “Grátis”." };
  if (Number.isNaN(min) || Number.isNaN(max)) return { error: "Preço inválido. Ex.: 25 ou 25,50." };
  if (min === 0) return { error: "Preço R$ 0? Então marca “Grátis”." };
  if (max !== null && max < min) return { error: "O preço “até” precisa ser maior que o “a partir de”." };
  return { is_free: false, price_min_cents: min, price_max_cents: max !== null && max > min ? max : null, price_cents: min };
}
