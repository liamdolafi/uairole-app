import { useEffect, useState } from "react";
import { View } from "react-native";
import { Card, ErrorBox, T, Toggle, s } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { DEFAULT_NOTIFICATION_PREFS, NOTIFICATION_KINDS, type NotificationKind, type NotificationPrefs } from "@/lib/types";

/** Liga/desliga cada tipo de aviso (vale pro celular e pro navegador) */
export function NotificationPrefsCard() {
  const { profile } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("notification_prefs")
      .select("*")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return setMissing(true); // 028 ainda não rodou
        setPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...((data ?? {}) as Partial<NotificationPrefs>) });
      });
  }, [profile]);

  if (!profile || missing || !prefs) return null;
  const isOrg = profile.role === "organizador" || profile.role === "admin";
  const isSocio = profile.role === "socio" || profile.role === "admin";
  const kinds = NOTIFICATION_KINDS.filter((k) => !k.only || (k.only === "organizador" ? isOrg : isSocio));

  async function set(kind: NotificationKind, v: boolean) {
    const old = prefs!;
    const next = { ...old, [kind]: v };
    setPrefs(next);
    setErr("");
    const { error } = await supabase.from("notification_prefs").upsert({ user_id: profile!.id, ...next, updated_at: new Date().toISOString() });
    if (error) {
      setErr(errMsg(error));
      setPrefs(old);
    }
  }

  return (
    <Card style={{ gap: 0 }}>
      <T weight="semibold">Quais avisos você quer</T>
      <T size={12} color={C.muted}>Desligado: o aviso fica em Avisos, mas não chega notificação. Menores nunca recebem aviso de evento acima da idade.</T>
      {err ? <ErrorBox message={err} /> : null}
      {kinds.map((k, i) => (
        <View key={k.id}>
          {i ? <View style={s.divider} /> : null}
          <Toggle on={prefs[k.id]} onChange={(v) => set(k.id, v)} label={k.label} hint={k.hint} />
        </View>
      ))}
    </Card>
  );
}
