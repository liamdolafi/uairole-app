import { Icon } from "@/components/icons";
import { Star } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { useAuth } from "../auth-provider";
import { Avatar } from "../avatar";
import { ReportSheet } from "../report-sheet";
import { Button, Card, ErrorBox, Input, LinkText, Row, Spinner, T } from "../ui";

type Review = { id: string; user_id: string; rating: number; comment: string | null; created_at: string };
type Author = { id: string; name: string; avatar_url: string | null };

function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }} accessibilityLabel={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} accessibilityRole={onChange ? "button" : undefined} accessibilityLabel={onChange ? `${n} estrela${n > 1 ? "s" : ""}` : undefined} style={onChange ? { width: 44, height: 44, alignItems: "center", justifyContent: "center" } : undefined}>
          <Icon icon={Star} size={onChange ? Math.max(size, 26) : size} color={n <= value ? C.warn : C.line} fill={n <= value ? C.warn : "none"} />
        </Pressable>
      ))}
    </View>
  );
}

/** Avaliações: só quem fez check-in avalia, 1 por evento (regra do banco) */
export function Reviews({ eventId, refreshKey }: { eventId: string; refreshKey: number }) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [canReview, setCanReview] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    const { data, error } = await supabase.from("reviews").select("id,user_id,rating,comment,created_at").eq("event_id", eventId).order("created_at", { ascending: false });
    if (error) return setError(errMsg(error));
    const list = (data ?? []) as Review[];
    setReviews(list);
    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("public_profiles").select("id,name,avatar_url").in("id", ids);
      const map: Record<string, Author> = {};
      for (const p of (ps ?? []) as Author[]) map[p.id] = p;
      setAuthors(map);
    }
    if (user) {
      const { count } = await supabase.from("checkins").select("id", { count: "exact", head: true }).eq("event_id", eventId);
      setCanReview((count ?? 0) > 0);
    } else setCanReview(false);
  }, [eventId, user]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const mine = reviews?.find((r) => r.user_id === user?.id);
  const avg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function save() {
    if (!rating) return setError("Escolhe de 1 a 5 estrelas.");
    setBusy(true);
    setError("");
    const payload = { rating, comment: comment.trim() || null };
    const { error } = mine ? await supabase.from("reviews").update(payload).eq("id", mine.id) : await supabase.from("reviews").insert({ ...payload, event_id: eventId });
    setBusy(false);
    if (error) return setError(/duplicate/i.test(error.message) ? "Você já avaliou esse rolê." : errMsg(error));
    setEditing(false);
    setRating(0);
    setComment("");
    load();
  }

  function remove(id: string) {
    Alert.alert("Apagar essa avaliação?", undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("reviews").delete().eq("id", id);
          if (error) return setError(errMsg(error));
          load();
        },
      },
    ]);
  }

  const showForm = user && canReview && (!mine || editing);

  return (
    <View style={{ gap: 12 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <T size={18} weight="display">Avaliações</T>
        {reviews?.length ? (
          <Row style={{ gap: 4 }}>
            <Icon icon={Star} size={16} color={C.warn} fill={C.warn} />
            <T size={14}>
              {avg.toFixed(1)} <T size={14} color={C.muted}>({reviews.length})</T>
            </T>
          </Row>
        ) : null}
      </Row>
      {error ? <ErrorBox message={error} /> : null}

      {showForm ? (
        <Card>
          <T size={14} weight="semibold">{mine ? "Editar sua avaliação" : "Como foi o rolê?"}</T>
          <Stars value={rating} onChange={setRating} size={30} />
          <Input placeholder="Conta como foi (opcional)" multiline maxLength={500} value={comment} onChangeText={setComment} />
          <Row>
            <Button onPress={save} loading={busy}>{mine ? "Salvar" : "Publicar"}</Button>
            {editing ? <Button variant="ghost" onPress={() => setEditing(false)}>Cancelar</Button> : null}
          </Row>
        </Card>
      ) : user && !canReview && !mine ? (
        <T size={14} color={C.muted}>Só quem fez check-in pode avaliar.</T>
      ) : !user ? (
        <T size={14} color={C.muted}>Entra e faz check-in no rolê pra poder avaliar.</T>
      ) : null}

      {!reviews ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <T size={14} color={C.muted}>Ninguém avaliou ainda.</T>
      ) : (
        reviews.map((r) => {
          const a = authors[r.user_id];
          const isMine = r.user_id === user?.id;
          return (
            <Card key={r.id} style={{ padding: 12, gap: 8 }}>
              <Row>
                <Avatar name={a?.name ?? "?"} url={a?.avatar_url} size={30} />
                <View style={{ flex: 1 }}>
                  <T size={14} weight="semibold" numberOfLines={1}>{a?.name ?? "Alguém"}</T>
                  <Stars value={r.rating} size={13} />
                </View>
                <T size={12} color={C.muted}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</T>
              </Row>
              {r.comment ? <T size={14} color={`${C.ink}e6`}>{r.comment}</T> : null}
              <Row style={{ gap: 16 }}>
                {isMine ? (
                  <>
                    <LinkText
                      size={12}
                      onPress={() => {
                        setRating(r.rating);
                        setComment(r.comment ?? "");
                        setEditing(true);
                      }}
                    >
                      Editar
                    </LinkText>
                    <LinkText size={12} color={C.danger} onPress={() => remove(r.id)}>Apagar</LinkText>
                  </>
                ) : (
                  <>
                    <LinkText size={12} color={C.muted} onPress={() => setReporting(r.id)}>Denunciar</LinkText>
                    {profile?.role === "admin" ? <LinkText size={12} color={C.danger} onPress={() => remove(r.id)}>Remover (admin)</LinkText> : null}
                  </>
                )}
              </Row>
            </Card>
          );
        })
      )}
      {reporting ? <ReportSheet open target={{ kind: "comentario", reviewId: reporting }} onClose={() => setReporting(null)} /> : null}
    </View>
  );
}
