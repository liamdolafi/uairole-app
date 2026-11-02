import { supabase } from "@/lib/supabase";

export type Post = {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  event_id: string | null;
  venue_id: string | null;
  reply_to: string | null;
  hidden: boolean;
  hidden_reason: string | null;
  like_count: number;
  reply_count: number;
  report_count: number;
  created_at: string;
  event?: { id: string; title: string; age_rating: string } | null;
  venue?: { id: string; name: string; neighborhood: string } | null;
};

export type Author = { id: string; name: string; avatar_url: string | null };

export const POST_SELECT = "*, event:events(id,title,age_rating), venue:venues(id,name,neighborhood)";

export async function fetchAuthors(ids: string[]) {
  const map: Record<string, Author> = {};
  const uniq = [...new Set(ids)];
  if (!uniq.length) return map;
  const { data } = await supabase.from("public_profiles").select("id,name,avatar_url").in("id", uniq);
  for (const a of (data ?? []) as Author[]) map[a.id] = a;
  return map;
}

export async function fetchMyLikes(postIds: string[]) {
  if (!postIds.length) return new Set<string>();
  const { data } = await supabase.from("post_likes").select("post_id").in("post_id", postIds);
  return new Set((data ?? []).map((l) => l.post_id as string));
}

/** "Em alta": curtidas e respostas recentes pesam mais */
export function hotScore(p: Post, now = Date.now()) {
  const hours = (now - new Date(p.created_at).getTime()) / 3600000;
  return (p.like_count * 2 + p.reply_count * 3 + 1) / Math.pow(hours + 2, 1.5);
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
