import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { useAuth } from "./auth-provider";
import { Button, ErrorBox, Input, Notice, Sheet, T } from "./ui";

const EVENT_REASONS = ["Informação falsa", "Conteúdo ofensivo", "Golpe ou spam", "Promove bebida para menores", "Classificação etária errada", "Outro"];
const POST_REASONS = ["Ofensa ou ódio", "Assédio", "Spam ou golpe", "Conteúdo impróprio", "Promove bebida para menores", "Outro"];

export type ReportTarget = { kind: "evento"; eventId: string } | { kind: "comentario"; reviewId: string } | { kind: "post"; postId: string };

/** Denunciar evento, avaliação ou post (mesmas tabelas e regras do site) */
export function ReportSheet({ target, open, onClose }: { target: ReportTarget; open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const isPost = target.kind === "post";
  const reasons = isPost ? POST_REASONS : EVENT_REASONS;

  function close() {
    onClose();
    setDone(false);
    setReason("");
    setDetails("");
    setError("");
  }

  async function send() {
    if (!reason) return setError("Escolhe um motivo.");
    setBusy(true);
    setError("");
    const text = details.trim() ? `${reason}: ${details.trim()}` : reason;
    const { error } =
      target.kind === "post"
        ? await supabase.from("post_reports").insert({ post_id: target.postId, reason: text.slice(0, 300) })
        : await supabase.from("reports").insert({
            target: target.kind,
            event_id: target.kind === "evento" ? target.eventId : null,
            review_id: target.kind === "comentario" ? target.reviewId : null,
            reason: text.slice(0, 500),
          });
    setBusy(false);
    if (error) return setError(/duplicate/i.test(error.message) ? "Você já denunciou isso." : errMsg(error));
    setDone(true);
  }

  const title = target.kind === "evento" ? "Denunciar evento" : target.kind === "comentario" ? "Denunciar comentário" : "Denunciar post";

  return (
    <Sheet open={open} onClose={close} title={title}>
      {!user ? (
        <View style={{ gap: 10 }}>
          <T size={14} color={C.muted}>Pra denunciar, entra na sua conta.</T>
          <Button
            onPress={() => {
              close();
              router.push("/entrar");
            }}
          >
            Entrar
          </Button>
        </View>
      ) : done ? (
        <Notice>{isPost ? "Valeu! A denúncia foi pro admin. Com 3 denúncias o post fica oculto até a revisão." : "Valeu! A denúncia foi pro admin, que vai dar uma olhada. "}</Notice>
      ) : (
        <View style={{ gap: 12 }}>
          {error ? <ErrorBox message={error} /> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {reasons.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                style={{ borderRadius: R.full, borderWidth: 1, borderColor: reason === r ? C.accent : C.line, backgroundColor: reason === r ? C.accent : "transparent", paddingHorizontal: 12, paddingVertical: 7 }}
              >
                <T size={13} color={reason === r ? C.white : C.ink}>{r}</T>
              </Pressable>
            ))}
          </View>
          <Input placeholder="Conta mais (opcional)" multiline maxLength={isPost ? 250 : 400} value={details} onChangeText={setDetails} />
          <Button variant="danger" onPress={send} loading={busy}>Enviar denúncia</Button>
        </View>
      )}
    </Sheet>
  );
}
