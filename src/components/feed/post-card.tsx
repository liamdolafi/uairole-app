import { Flag, Heart, MapPin, MessageCircle, PartyPopper, Share2, Trash2, type LucideIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { timeAgo, type Author, type Post } from "@/lib/feed";
import { errMsg } from "@/lib/format";
import { shareLink } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { useAuth } from "../auth-provider";
import { Avatar } from "../avatar";
import { ReportSheet } from "../report-sheet";
import { Icon } from "../icons";
import { T } from "../ui";

const openPost = (id: string) => router.push({ pathname: "/post/[id]", params: { id } });

export function PostCard({ post, author, liked, onChange }: { post: Post; author?: Author; liked: boolean; onChange: () => void }) {
  const { user, profile } = useAuth();
  const [isLiked, setLiked] = useState(liked);
  const [likes, setLikes] = useState(post.like_count);
  const [reportOpen, setReportOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const isMine = user?.id === post.author_id;
  const isAdmin = profile?.role === "admin";

  async function like() {
    if (!user) return router.push("/entrar");
    const was = isLiked;
    setLiked(!was);
    setLikes((n) => n + (was ? -1 : 1));
    if (!was) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const { error } = was
      ? await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("post_likes").insert({ post_id: post.id });
    if (error) {
      setLiked(was);
      setLikes((n) => n + (was ? 1 : -1));
    }
  }

  function remove() {
    Alert.alert("Apagar esse post?", undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("posts").delete().eq("id", post.id);
          if (error) return Alert.alert("Ops", errMsg(error));
          onChange();
        },
      },
    ]);
  }

  const openAuthor = () => router.push({ pathname: "/pessoa/[id]", params: { id: post.author_id } });

  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: `${C.line}b3`, opacity: post.hidden ? 0.6 : 1, flexDirection: "row", gap: 12 }}>
      <Pressable onPress={openAuthor}>
        <Avatar name={author?.name ?? "?"} url={author?.avatar_url} size={40} />
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <T size={14} weight="semibold" numberOfLines={1} onPress={openAuthor} style={{ flexShrink: 1 }}>{author?.name ?? "Alguém"}</T>
          <T size={12} color={C.muted}>· {timeAgo(post.created_at, now)}</T>
        </View>
        {post.hidden ? (
          <T size={12} weight="semibold" color={C.warn}>Oculto {post.hidden_reason === "denuncias" ? "por denúncias (aguardando revisão)" : "pela moderação"}</T>
        ) : null}
        <Pressable onPress={() => openPost(post.id)}>
          <T size={15} style={{ lineHeight: 20 }}>{post.body}</T>
        </Pressable>
        {post.image_url ? (
          <Pressable onPress={() => openPost(post.id)}>
            <Image source={{ uri: post.image_url }} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, marginTop: 4 }} contentFit="cover" />
          </Pressable>
        ) : null}
        {post.event ? (
          <Tag icon={PartyPopper} label={post.event.title} onPress={() => router.push({ pathname: "/evento/[id]", params: { id: post.event!.id } })} />
        ) : post.venue ? (
          <Tag icon={MapPin} label={post.venue.name} onPress={() => router.push({ pathname: "/local/[id]", params: { id: post.venue!.id } })} />
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
          <Pressable onPress={like} style={{ minWidth: 44, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 }} accessibilityRole="button" accessibilityState={{ selected: isLiked }} accessibilityLabel="Curtir">
            <Icon icon={Heart} size={18} color={isLiked ? C.accent : C.muted} fill={isLiked ? C.accent : "none"} />
            {likes ? <T size={12} color={isLiked ? C.accent : C.muted}>{likes}</T> : null}
          </Pressable>
          <Pressable onPress={() => openPost(post.id)} style={{ minWidth: 44, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 }} accessibilityRole="button" accessibilityLabel="Responder">
            <Icon icon={MessageCircle} size={18} color={C.muted} />
            {post.reply_count ? <T size={12} color={C.muted}>{post.reply_count}</T> : null}
          </Pressable>
          <Pressable onPress={() => shareLink({ title: "Post no Uai Rolê", message: post.body, path: `/feed/post/${post.id}` })} style={{ minWidth: 44, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 }} accessibilityRole="button" accessibilityLabel="Compartilhar">
            <Icon icon={Share2} size={18} color={C.muted} />
          </Pressable>
          {!isMine ? (
            <Pressable onPress={() => setReportOpen(true)} style={{ minWidth: 44, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 }} accessibilityRole="button" accessibilityLabel="Denunciar">
              <Icon icon={Flag} size={17} color={C.muted} />
            </Pressable>
          ) : null}
          {isMine || isAdmin ? (
            <Pressable onPress={remove} style={{ marginLeft: "auto", minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }} accessibilityRole="button" accessibilityLabel="Apagar">
              <Icon icon={Trash2} size={17} color={C.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {reportOpen ? <ReportSheet open target={{ kind: "post", postId: post.id }} onClose={() => setReportOpen(false)} /> : null}
    </View>
  );
}

function Tag({ icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={{ alignSelf: "flex-start", maxWidth: "100%", minHeight: 36, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.surface2, borderRadius: R.full, paddingHorizontal: 12, marginTop: 4 }}>
      <Icon icon={icon} size={14} color={C.accent} />
      <T size={12} numberOfLines={1} style={{ flexShrink: 1 }}>{label}</T>
    </Pressable>
  );
}
