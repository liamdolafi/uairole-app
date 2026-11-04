import * as WebBrowser from "expo-web-browser";
import { Linking, Platform, Share } from "react-native";
import { supabase } from "./supabase";

/** Endereço do site (links de compartilhar e áreas que só existem no site) */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || "https://uairole-taupe.vercel.app").replace(/\/$/, "");
export const CONTACT_EMAIL = "contato.uairole@gmail.com";
// WhatsApp de contato (só números, com DDI e DDD, ex.: 5531999999999). Vazio = o botão de WhatsApp não aparece.
export const CONTACT_WHATSAPP = (process.env.EXPO_PUBLIC_CONTACT_WHATSAPP ?? "").replace(/\D/g, "");
export const whatsappLink = (text: string) => (CONTACT_WHATSAPP ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}` : "");

export const siteLink = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Abre uma página do site num navegador dentro do app */
export async function openSite(path: string) {
  await WebBrowser.openBrowserAsync(siteLink(path), {
    toolbarColor: "#0b0b12",
    controlsColor: "#ff2e88",
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}

/** Compartilhar pelo menu do celular, com o link do site. Volta true se a pessoa compartilhou. */
export async function shareLink(opts: { title: string; message: string; path: string }) {
  const url = siteLink(opts.path);
  try {
    const r = await Share.share(
      Platform.OS === "ios" ? { title: opts.title, message: opts.message, url } : { title: opts.title, message: `${opts.message}\n${url}` },
    );
    return r.action !== Share.dismissedAction;
  } catch {
    return false; // cancelou
  }
}

/** "Como chegar": abre o app de mapas do celular */
export async function openDirections(lat: number, lng: number, label: string, eventId?: string) {
  if (eventId) supabase.rpc("track_click", { p_event: eventId, p_kind: "directions" }).then(() => {});
  const name = encodeURIComponent(label);
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${name}`,
    default: `geo:0,0?q=${lat},${lng}(${name})`,
  });
  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  }
}
