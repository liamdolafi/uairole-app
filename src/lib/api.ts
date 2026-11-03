import { siteLink } from "./site";
import { supabase } from "./supabase";

/**
 * Chama uma rota do servidor do site (pagamentos, Mercado Pago, busca de endereço) com o login do app.
 * O token secreto do Mercado Pago fica só no servidor: o app nunca vê.
 */
export async function api<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T | { error: string; notConfigured?: boolean }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: "Entre na sua conta pra continuar." };
  try {
    const res = await fetch(siteLink(path), {
      method: init.method ?? "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string; notConfigured?: boolean };
    // 404 = o site ainda não tem essa rota publicada (ex.: pagamentos ainda não ativados)
    if (res.status === 404) return { error: "Essa parte ainda não está disponível. Tenta mais tarde.", notConfigured: true };
    if (!res.ok) return { error: json.error ?? "Não deu certo agora. Tenta de novo.", notConfigured: json.notConfigured };
    return json;
  } catch {
    return { error: "Sem conexão com o servidor. Tenta de novo." };
  }
}
