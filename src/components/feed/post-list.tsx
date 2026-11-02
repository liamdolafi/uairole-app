import { useCallback, useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import { fetchAuthors, fetchMyLikes, hotScore, POST_SELECT, type Author, type Post } from "@/lib/feed";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { useAuth } from "../auth-provider";
import { Button, ErrorBox, Spinner, T } from "../ui";
import { PostCard } from "./post-card";

const PAGE = 30;

/** Lista de posts: do feed geral, de um evento ou respostas de um post */
export function PostList({
  mode = "recentes",
  eventId,
  replyTo,
  refreshKey = 0,
  empty,
}: {
  mode?: "recentes" | "alta";
  eventId?: string;
  replyTo?: string;
  refreshKey?: number;
  empty?: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (before?: string) => {
      let q = supabase.from("posts").select(POST_SELECT);
      if (replyTo) q = q.eq("reply_to", replyTo).order("created_at", { ascending: true }).limit(200);
      else {
        q = q.is("reply_to", null);
        if (eventId) q = q.eq("event_id", eventId);
        if (mode === "alta") q = q.gt("created_at", new Date(Date.now() - 72 * 3600000).toISOString()).limit(200);
        else q = q.limit(PAGE);
        q = q.order("created_at", { ascending: false });
        if (before && mode === "recentes") q = q.lt("created_at", before);
      }
      const { data, error } = await q;
      if (error) throw error;
      let list = (data ?? []) as Post[];
      if (mode === "alta" && !replyTo) {
        const now = Date.now();
        list = list.sort((a, b) => hotScore(b, now) - hotScore(a, now)).slice(0, 50);
      }
      const [a, l] = await Promise.all([fetchAuthors(list.map((p) => p.author_id)), user ? fetchMyLikes(list.map((p) => p.id)) : new Set<string>()]);
      return { list, a, l };
    },
    [mode, eventId, replyTo, user],
  );

  const load = useCallback(async () => {
    setError("");
    try {
      const { list, a, l } = await fetchPage();
      setPosts(list);
      setAuthors(a);
      setLikes(l);
      setMore(mode === "recentes" && !replyTo && list.length === PAGE);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [fetchPage, mode, replyTo]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load, refreshKey]);

  async function loadMore() {
    if (!posts?.length) return;
    setLoadingMore(true);
    try {
      const { list, a, l } = await fetchPage(posts[posts.length - 1].created_at);
      setPosts((p) => [...(p ?? []), ...list]);
      setAuthors((x) => ({ ...x, ...a }));
      setLikes((x) => new Set([...x, ...l]));
      setMore(list.length === PAGE);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoadingMore(false);
    }
  }

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!posts) return <View style={{ paddingVertical: 24 }}><Spinner /></View>;
  if (!posts.length) return <>{empty ?? <T size={14} color={C.muted} center>Nenhum post ainda.</T>}</>;

  return (
    <View>
      {posts.map((p) => (
        <PostCard key={`${p.id}-${refreshKey}`} post={p} author={authors[p.author_id]} liked={likes.has(p.id)} onChange={load} />
      ))}
      {more ? (
        <Button variant="outline" onPress={loadMore} loading={loadingMore} style={{ marginTop: 12 }}>
          Carregar mais
        </Button>
      ) : null}
    </View>
  );
}
