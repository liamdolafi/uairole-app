import { router } from "expo-router";
import { openSite } from "./site";

/**
 * Abre um link do site (ex.: "/evento/123", vindo de um aviso ou push).
 * O que existe no app abre no app; o resto (Admin, Sócios e finanças, páginas legais) abre no navegador.
 */
export function openAppUrl(url: string | null | undefined) {
  if (!url) return;
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const [p] = path.split("?");
  let m: RegExpMatchArray | null;
  if ((m = p.match(/^\/evento\/([\w-]+)/))) return router.push({ pathname: "/evento/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/local\/([\w-]+)/))) return router.push({ pathname: "/local/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/organizador\/([\w-]+)/))) return router.push({ pathname: "/organizador/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/pessoa\/([\w-]+)/))) return router.push({ pathname: "/pessoa/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/feed\/post\/([\w-]+)/))) return router.push({ pathname: "/post/[id]", params: { id: m[1] } });
  if (p === "/perfil" && /aba=amigos/.test(path)) return router.push("/amigos");
  if (p === "/perfil" && /aba=privacidade/.test(path)) return router.push("/privacidade");
  if (p === "/notificacoes") return router.push("/avisos");
  // telas nativas que antes abriam o site
  if ((m = p.match(/^\/comprar\/([\w-]+)/))) return router.push({ pathname: "/comprar/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/pagamento\/([\w-]+)/))) return router.push({ pathname: "/pagamento/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/painel\/eventos\/([\w-]+)\/vendas/))) return router.push({ pathname: "/painel/vendas/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/painel\/eventos\/([\w-]+)\/estatisticas/))) return router.push({ pathname: "/painel/estatisticas/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/painel\/eventos\/([\w-]+)/))) return router.push({ pathname: "/painel/evento/[id]", params: { id: m[1] } });
  if ((m = p.match(/^\/painel\/locais\/([\w-]+)/))) return router.push({ pathname: "/painel/local/[id]", params: { id: m[1] } });
  if (p === "/ingressos") return router.push("/ingressos");
  if (p === "/sugerir") return router.push("/sugerir");
  if (p === "/painel/locais") return router.push("/painel/locais");
  if (p === "/painel/leitor") return router.push("/painel/leitor");
  if (p === "/painel/mercado-pago") return router.push("/painel/mercado-pago");
  if (p === "/planos") return router.push("/painel/planos");
  if (p === "/painel" || p === "/organizadores") return router.push("/painel");
  if (p === "/" || p === "") return router.push("/");
  if (["/feed", "/mapa", "/favoritos", "/perfil"].includes(p)) return router.push(p as "/feed");
  return openSite(path);
}

/** Fecha as telas de login e volta pro início */
export function closeAuth() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/");
}
