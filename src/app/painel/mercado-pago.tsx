import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { CircleCheck, Wallet } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, ErrorBox, Loading, Notice, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";

type Account = { connected: boolean; live_mode: boolean; connected_at: string } | null;

/** Conectar a conta Mercado Pago do organizador (o dinheiro dos ingressos cai direto nela) */
export default function MercadoPagoScreen() {
  const params = useLocalSearchParams<{ ok?: string; erro?: string }>();
  const [acc, setAcc] = useState<Account | undefined>(undefined);
  const [err, setErr] = useState(params.erro ?? "");
  const [msg, setMsg] = useState(params.ok ? "Conta do Mercado Pago conectada! Agora você pode vender ingressos." : "");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("my_mp_account");
    if (error) return setErr(errMsg(error));
    setAcc((data as Account) ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function connect() {
    setErr("");
    setBusy(true);
    const r = await api<{ url: string }>("/api/mercadopago/conectar");
    if ("error" in r) {
      setBusy(false);
      return setErr(r.error);
    }
    // abre o Mercado Pago no navegador; quando a pessoa autoriza, o site manda de volta pro app
    const res = await WebBrowser.openAuthSessionAsync(r.url, "uairole://painel/mercado-pago");
    setBusy(false);
    if (res.type === "success" && /ok=1/.test(res.url)) setMsg("Conta do Mercado Pago conectada! Agora você pode vender ingressos.");
    else if (res.type === "success" && /erro=/.test(res.url)) setErr(decodeURIComponent(res.url.split("erro=")[1] ?? ""));
    load();
  }

  function disconnect() {
    Alert.alert("Desconectar o Mercado Pago?", "Seus eventos param de vender ingressos até você conectar de novo.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desconectar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.rpc("disconnect_mp_account");
          if (error) return setErr(errMsg(error));
          load();
        },
      },
    ]);
  }

  return (
    <Screen padTop={false} onRefresh={load}>
      {msg ? <Notice>{msg}</Notice> : null}
      {err ? <ErrorBox message={err} /> : null}
      {acc === undefined ? (
        <Loading />
      ) : acc ? (
        <Card style={{ borderColor: `${C.ok}66`, backgroundColor: `${C.ok}14` }}>
          <Row>
            <Icon icon={CircleCheck} size={18} color={C.ok} />
            <T weight="semibold">Conta conectada</T>
          </Row>
          <T size={13} color={C.muted}>
            Conectada em {new Date(acc.connected_at).toLocaleDateString("pt-BR")}{acc.live_mode ? "" : " (conta de teste)"}. O dinheiro dos ingressos cai direto nela; o Uai Rolê fica só com a taxa de serviço que quem compra paga.
          </T>
          <Button variant="ghost" onPress={disconnect}>Desconectar</Button>
        </Card>
      ) : (
        <Card>
          <T size={14}>Conecte sua conta do Mercado Pago pra vender ingressos aqui. O dinheiro de cada venda cai direto na sua conta. Quem compra paga uma taxa de serviço pro Uai Rolê, e o Mercado Pago desconta a taxa dele do valor que você recebe.</T>
          <T size={12} color={C.muted}>Você entra no site do Mercado Pago (abre o navegador) e autoriza. O Uai Rolê nunca vê sua senha.</T>
          <Button loading={busy} onPress={connect}>
            <Row>
              <Icon icon={Wallet} size={18} color={C.white} />
              <T weight="semibold" color={C.white}>Conectar Mercado Pago</T>
            </Row>
          </Button>
        </Card>
      )}
    </Screen>
  );
}
