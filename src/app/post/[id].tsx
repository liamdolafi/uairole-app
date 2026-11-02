import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Composer } from "@/components/feed/composer";
import { PostCard } from "@/components/feed/post-card";
import { PostList } from "@/components/feed/post-list";
import { Button, Empty, ErrorBox, LinkText, Loading, Screen, T } from "@/components/ui";
import { fetchAuthors, fetchMyLikes, POST_SELECT, type Author, type Post } from "@/lib/feed";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [author, setAuthor] = useState<Author>();
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState("");
  const [key, setKey] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
    if (error) return /invalid input syntax/i.test(error.message) ? setPost(null) : setError(errMsg(error));
    const p = (data as Post) ?? null;
    setPost(p);
    if (p) {
      setAuthor((await fetchAuthors([p.author_id]))[p.author_id]);
      if (user) setLiked((await fetchMyLikes([p.id])).has(p.id));
    }
  }, [id, user]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load, key]);

  if (error) return <Screen padTop={false}><ErrorBox message={error} onRetry={load} /></Screen>;
  if (post === undefined) return <Screen padTop={false}><Loading /></Screen>;
  if (post === null)
    return (
      <Screen padTop={false}>
        <Empty emoji="🫥" title="Post não encontrado">
          <T size={14} color={C.muted} center>Ele pode ter sido apagado ou não estar disponível pra você.</T>
          <Button onPress={() => router.replace("/feed")} style={{ marginTop: 14 }}>Voltar pro Feed</Button>
        </Empty>
      </Screen>
    );

  return (
    <Screen padTop={false} contentStyle={{ gap: 8 }}>
      {post.reply_to ? <LinkText color={C.muted} onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.reply_to! } })}>← Post original</LinkText> : null}
      <PostCard key={`${post.id}-${key}`} post={post} author={author} liked={liked} onChange={() => (router.canGoBack() ? router.back() : router.replace("/feed"))} />
      {user ? <Composer replyTo={post.id} placeholder="Escreve sua resposta..." onPosted={() => setKey((k) => k + 1)} /> : null}
      <T size={13} weight="semibold" color={C.muted} style={{ paddingTop: 8 }}>Respostas</T>
      <PostList replyTo={post.id} refreshKey={key} empty={<T size={14} color={C.muted}>Ninguém respondeu ainda.</T>} />
    </Screen>
  );
}
