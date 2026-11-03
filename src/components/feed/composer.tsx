import { Icon } from "@/components/icons";
import { ImagePlus, MapPin, PartyPopper, Tag, X } from "lucide-react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { errMsg } from "@/lib/format";
import { askPhotoSource, uploadPhoto, type PickedPhoto } from "@/lib/photos";
import { hasProfanity } from "@/lib/profanity";
import { supabase } from "@/lib/supabase";
import { C, F, R } from "@/lib/theme";
import { useAuth } from "../auth-provider";
import { Avatar } from "../avatar";
import { Button, ErrorBox, Input, T } from "../ui";

type Tag = { kind: "evento" | "local"; id: string; label: string };

/** Escrever post ou resposta (até 280 caracteres, com foto e evento/local marcado) */
export function Composer({
  replyTo,
  fixedEvent,
  onPosted,
  placeholder = "O que tá rolando, sô?",
}: {
  replyTo?: string;
  fixedEvent?: { id: string; title: string };
  onPosted: () => void;
  placeholder?: string;
}) {
  const { profile } = useAuth();
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [tag, setTag] = useState<Tag | null>(fixedEvent ? { kind: "evento", id: fixedEvent.id, label: fixedEvent.title } : null);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [tagResults, setTagResults] = useState<Tag[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [banned, setBanned] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("feed_bans")
      .select("user_id")
      .eq("user_id", profile.id)
      .maybeSingle()
      .then(({ data }) => setBanned(Boolean(data)));
  }, [profile]);

  useEffect(() => {
    const q = tagSearch.trim().replace(/[%_]/g, "");
    if (q.length < 2) return setTagResults([]);
    const t = setTimeout(async () => {
      const [ev, ve] = await Promise.all([
        supabase.from("events").select("id,title").eq("status", "ativo").gt("ends_at", new Date().toISOString()).ilike("title", `%${q}%`).limit(5),
        supabase.from("venues").select("id,name").eq("archived", false).ilike("name", `%${q}%`).limit(5),
      ]);
      setTagResults([
        ...(ev.data ?? []).map((e) => ({ kind: "evento" as const, id: e.id as string, label: e.title as string })),
        ...(ve.data ?? []).map((v) => ({ kind: "local" as const, id: v.id as string, label: v.name as string })),
      ]);
    }, 350);
    return () => clearTimeout(t);
  }, [tagSearch]);

  if (!profile) return null;
  if (banned)
    return (
      <View style={{ borderRadius: R.lg, borderWidth: 1, borderColor: `${C.danger}66`, backgroundColor: `${C.danger}1a`, padding: 12 }}>
        <T size={14} color={C.danger}>Sua conta está suspensa do Feed. Você ainda pode ler os posts.</T>
      </View>
    );

  const left = 280 - body.length;

  async function publish() {
    const text = body.trim();
    setError("");
    if (!text) return setError("Escreve alguma coisa, uai.");
    if (text.length > 280) return setError("Máximo de 280 caracteres.");
    if (hasProfanity(text)) return setError("Seu post tem palavrão ou ofensa. Dá uma revisada, sô!");
    setBusy(true);
    try {
      const image_url = photo ? await uploadPhoto("posts", profile!.id, photo) : null;
      const { error } = await supabase.from("posts").insert({
        body: text,
        image_url,
        reply_to: replyTo ?? null,
        event_id: tag?.kind === "evento" ? tag.id : null,
        venue_id: tag?.kind === "local" ? tag.id : null,
      });
      if (error) throw error;
      setBody("");
      setPhoto(null);
      if (!fixedEvent) setTag(null);
      onPosted();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flexDirection: "row", gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: `${C.line}b3` }}>
      <Avatar name={profile.name} url={profile.avatar_url} size={40} />
      <View style={{ flex: 1, gap: 8 }}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={placeholder}
          placeholderTextColor={`${C.muted}aa`}
          selectionColor={C.accent}
          multiline
          maxLength={300}
          style={{ color: C.ink, fontFamily: F.regular, fontSize: 15, minHeight: replyTo ? 44 : 64, textAlignVertical: "top", paddingTop: 8 }}
        />
        {photo ? (
          <View>
            <Image source={{ uri: photo.uri }} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: R.lg }} contentFit="cover" />
            <Pressable onPress={() => setPhoto(null)} style={{ position: "absolute", right: 4, top: 4, width: 44, height: 44, alignItems: "center", justifyContent: "center" }} accessibilityRole="button" accessibilityLabel="Remover foto">
              <View style={{ backgroundColor: "#000b", borderRadius: R.full, padding: 5 }}>
                <Icon icon={X} size={18} color={C.white} />
              </View>
            </Pressable>
          </View>
        ) : null}
        {tag ? (
          <View style={{ flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 8, backgroundColor: C.surface2, borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Icon icon={tag.kind === "evento" ? PartyPopper : MapPin} size={14} color={C.accent} />
            <T size={12} numberOfLines={1} style={{ flexShrink: 1 }}>{tag.label}</T>
            {!fixedEvent ? (
              <Pressable onPress={() => setTag(null)} hitSlop={14} accessibilityRole="button" accessibilityLabel="Tirar marcação">
                <Icon icon={X} size={16} color={C.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {tagOpen && !tag ? (
          <View style={{ gap: 6 }}>
            <Input placeholder="Buscar evento ou local..." value={tagSearch} onChangeText={setTagSearch} autoFocus />
            {tagResults.map((r) => (
              <Pressable
                key={`${r.kind}-${r.id}`}
                onPress={() => {
                  setTag(r);
                  setTagOpen(false);
                  setTagSearch("");
                }}
                style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Icon icon={r.kind === "evento" ? PartyPopper : MapPin} size={16} color={C.accent} />
                <T size={14} style={{ flex: 1 }}>{r.label}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
        {error ? <ErrorBox message={error} /> : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable onPress={async () => setPhoto((await askPhotoSource()) ?? photo)} accessibilityRole="button" accessibilityLabel="Adicionar foto" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Icon icon={ImagePlus} size={22} color={C.accent} />
          </Pressable>
          {!fixedEvent && !replyTo ? (
            <Pressable onPress={() => setTagOpen(!tagOpen)} accessibilityRole="button" accessibilityLabel="Marcar evento ou local" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <Icon icon={Tag} size={20} color={C.accent} />
            </Pressable>
          ) : null}
          <T size={12} color={left < 0 ? C.danger : left < 30 ? C.warn : C.muted} style={{ marginLeft: "auto" }}>{left}</T>
          <Button small onPress={publish} loading={busy} disabled={!body.trim() || left < 0}>
            {replyTo ? "Responder" : "Postar"}
          </Button>
        </View>
      </View>
    </View>
  );
}
