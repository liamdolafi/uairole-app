import { BadgeCheck, Hourglass, Store } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icons";
import { Button, ErrorBox, Input, Notice, Row, Sheet, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R, TOUCH } from "@/lib/theme";
import { CLAIM_JOBS, type ClaimJob, type VenueClaim } from "@/lib/types";

/** Selo "Local verificado" (local com dono organizador) */
export function VerifiedBadge() {
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, borderRadius: R.full, backgroundColor: `${C.ok}26`, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Icon icon={BadgeCheck} size={13} color={C.ok} />
      <T size={12} weight="bold" color={C.ok}>Local verificado</T>
    </View>
  );
}

export function useVenueVerified(venueId: string) {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.rpc("venue_is_verified", { p_venue: venueId }).then(({ data, error }) => setV(error ? null : !!data));
  }, [venueId]);
  return v;
}

/** "Este local é meu": pedido de dono, analisado pelo admin */
export function VenueClaimButton({ venueId, venueName, ownerId, verified }: { venueId: string; venueName: string; ownerId: string | null; verified: boolean | null }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<VenueClaim | null | undefined>(undefined);
  const [f, setF] = useState({ contact_name: "", job: "dono" as ClaimJob, contact: "", instagram: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("venue_claims")
      .select("*")
      .eq("venue_id", venueId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => setMine(error ? null : ((data as VenueClaim) ?? null)));
  }, [user, venueId, sent]);

  useEffect(() => {
    if (profile && !f.contact_name) setF((o) => ({ ...o, contact_name: profile.name, contact: profile.email ?? "" }));
  }, [profile, f.contact_name]);

  if (verified !== false || !user || ownerId === user.id) return null;
  if (mine?.status === "pendente")
    return (
      <Row style={{ alignItems: "flex-start", padding: 12, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface }}>
        <Icon icon={Hourglass} size={16} color={C.warn} />
        <T size={13} color={C.warn} style={{ flex: 1 }}>Seu pedido pra ser responsável por esse local está em análise. A gente te avisa.</T>
      </Row>
    );

  async function send() {
    setError("");
    if (f.contact_name.trim().length < 2) return setError("Coloca seu nome.");
    if (f.contact.trim().length < 5) return setError("Coloca um telefone ou e-mail pra gente confirmar.");
    setBusy(true);
    const { error } = await supabase
      .from("venue_claims")
      .insert({ venue_id: venueId, user_id: user!.id, contact_name: f.contact_name.trim(), job: f.job, contact: f.contact.trim(), instagram: f.instagram.trim() || null });
    setBusy(false);
    if (error) return setError(/venue_claims|schema cache/i.test(error.message) ? "Ainda não dá pra pedir: falta atualizar o banco (033)." : errMsg(error));
    setSent(true);
    setOpen(false);
  }

  return (
    <View style={{ gap: 8 }}>
      {sent ? <Notice>Pedido enviado! A gente confere e te avisa por aqui.</Notice> : null}
      {mine?.status === "recusada" ? (
        <T size={12} color={C.muted}>Seu último pedido pra esse local não foi aprovado{mine.admin_note ? `: ${mine.admin_note}` : "."}</T>
      ) : null}
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={{ minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
        <Icon icon={Store} size={16} color={C.accent} />
        <T size={14} weight="semibold" color={C.accent}>Este local é meu</T>
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title="Este local é meu">
        <View style={{ gap: 12 }}>
          <T size={13} color={C.muted}>
            É dono, gerente ou produtor de <T size={13} weight="bold">{venueName}</T>? Manda seus dados. A gente confere por fora e, se estiver tudo certo, o local e os
            rolês dele passam pra sua conta, com Painel de organizador.
          </T>
          {error ? <ErrorBox message={error} /> : null}
          <Input label="Seu nome" maxLength={80} value={f.contact_name} onChangeText={(t) => setF({ ...f, contact_name: t })} />
          <View style={{ gap: 6 }}>
            <T size={13} weight="medium" color={C.muted}>Cargo</T>
            <Row>
              {CLAIM_JOBS.map((j) => (
                <Button key={j.id} small variant={f.job === j.id ? "primary" : "ghost"} style={{ flex: 1 }} onPress={() => setF({ ...f, job: j.id })} accessibilityState={{ selected: f.job === j.id }}>
                  {j.label}
                </Button>
              ))}
            </Row>
          </View>
          <Input label="Telefone ou e-mail de contato" maxLength={120} autoCapitalize="none" value={f.contact} onChangeText={(t) => setF({ ...f, contact: t })} />
          <Input label="Instagram do local (opcional)" placeholder="@seulocal" maxLength={60} autoCapitalize="none" value={f.instagram} onChangeText={(t) => setF({ ...f, instagram: t })} />
          <T size={12} color={C.muted}>Só o time do Uai Rolê vê esses dados, pra confirmar que o local é seu.</T>
          <Button onPress={send} loading={busy}>Enviar pedido</Button>
        </View>
      </Sheet>
    </View>
  );
}
