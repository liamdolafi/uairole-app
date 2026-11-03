import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { CircleCheck, CircleX, Clock, Copy, CreditCard, FlaskConical, Ticket } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, Empty, ErrorBox, Loading, LoginNeeded, Notice, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { formatReais } from "@/lib/format";
import { simulatePayment, usePayment } from "@/lib/payments";
import { C } from "@/lib/theme";
import { PAYMENT_STATUS_LABEL } from "@/lib/types";

const TEST_MODE = (process.env.EXPO_PUBLIC_MP_MODE || "teste") !== "producao";

function useCountdown(until: string | undefined) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!until) return;
    const tick = () => setLeft(Math.max(0, new Date(until).getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [until]);
  return { left, text: `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}` };
}

/** Pagamento: Pix com QR code, copia e cola e prazo; ou espera a confirmação do cartão. Atualiza sozinha. */
export default function PagamentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { payment, verify } = usePayment(id);
  const { left, text } = useCountdown(payment?.status === "pendente" ? payment.expires_at : undefined);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (payment?.status === "pago") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [payment?.status]);

  if (loading || payment === undefined) return <Screen padTop={false}><Loading /></Screen>;
  if (!user) return <Screen padTop={false}><LoginNeeded /></Screen>;
  if (!payment) return <Screen padTop={false}><Empty title="Pagamento não encontrado" /></Screen>;

  const failed = ["recusado", "expirado", "cancelado"].includes(payment.status) || (payment.status === "pendente" && payment.method === "pix" && left === 0);

  async function copy() {
    if (!payment?.pix_qr) return;
    await Clipboard.setStringAsync(payment.pix_qr);
    setCopied(true);
    Haptics.selectionAsync().catch(() => {});
    setTimeout(() => setCopied(false), 2500);
  }

  async function simulate() {
    setBusy(true);
    setErr((await simulatePayment(id)) ?? "");
    await verify();
    setBusy(false);
  }

  return (
    <Screen padTop={false} onRefresh={verify}>
      <View style={{ gap: 2 }}>
        <T size={14} color={C.muted}>{payment.description}</T>
        <T size={32} weight="displayBlack">{formatReais(payment.amount_cents)}</T>
        {payment.fee_cents ? (
          <T size={12} color={C.muted}>{formatReais(payment.subtotal_cents)} + {formatReais(payment.fee_cents)} de taxa de serviço</T>
        ) : null}
      </View>

      {payment.status === "pago" ? (
        <Card style={{ alignItems: "center", borderColor: `${C.ok}66`, backgroundColor: `${C.ok}1a` }}>
          <Icon icon={CircleCheck} size={44} color={C.ok} />
          <T size={20} weight="display">Pagamento confirmado!</T>
          <T size={14} color={C.muted} center>
            {payment.kind === "ingresso" ? "Seus ingressos já estão em Meus ingressos. Mandamos uma cópia por e-mail." : "Seu plano já está valendo."}
          </T>
          <Button style={{ alignSelf: "stretch" }} onPress={() => router.replace(payment.kind === "ingresso" ? "/ingressos" : "/painel")}>
            {payment.kind === "ingresso" ? (
              <Row>
                <Icon icon={Ticket} size={18} color={C.white} />
                <T weight="semibold" color={C.white}>Ver meus ingressos</T>
              </Row>
            ) : (
              "Ir pro Painel"
            )}
          </Button>
        </Card>
      ) : failed ? (
        <Card style={{ alignItems: "center", borderColor: `${C.danger}66`, backgroundColor: `${C.danger}1a` }}>
          <Icon icon={CircleX} size={44} color={C.danger} />
          <T size={20} weight="display">{payment.status === "pendente" ? "O prazo do Pix acabou" : PAYMENT_STATUS_LABEL[payment.status]}</T>
          <T size={14} color={C.muted} center>Nada foi cobrado. Dá pra tentar de novo.</T>
          <Button variant="ghost" style={{ alignSelf: "stretch" }} onPress={() => router.back()}>Voltar</Button>
        </Card>
      ) : payment.status === "reembolsado" ? (
        <Notice>Esse pagamento foi reembolsado pelo Mercado Pago.</Notice>
      ) : payment.method === "pix" && payment.pix_qr ? (
        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <T weight="semibold">Pague com Pix</T>
            <Row style={{ gap: 4 }}>
              <Icon icon={Clock} size={14} color={left < 120000 ? C.warn : C.muted} />
              <T size={14} weight="semibold" color={left < 120000 ? C.warn : C.muted} accessibilityLiveRegion="polite">{text}</T>
            </Row>
          </Row>
          {payment.pix_qr_base64 ? (
            <View style={{ alignSelf: "center", backgroundColor: "#fff", padding: 8, borderRadius: 12 }}>
              <Image source={{ uri: `data:image/png;base64,${payment.pix_qr_base64}` }} style={{ width: 220, height: 220 }} accessibilityLabel="QR code do Pix" />
            </View>
          ) : null}
          <T size={12} color={C.muted} center>Abra o app do seu banco, escolha Pix e leia o QR code. Ou copie o código e cole no banco:</T>
          <View style={{ backgroundColor: C.surface2, borderRadius: 12, padding: 10 }}>
            <T size={11} selectable numberOfLines={4}>{payment.pix_qr}</T>
          </View>
          <Button onPress={copy}>
            <Row>
              <Icon icon={Copy} size={18} color={C.white} />
              <T weight="semibold" color={C.white}>{copied ? "Copiado!" : "Copiar código Pix"}</T>
            </Row>
          </Button>
          <T size={12} color={C.muted} center>Assim que o pagamento cair, esta tela atualiza sozinha.</T>
        </Card>
      ) : payment.method === "cartao" ? (
        <Card>
          <T size={14} color={C.muted}>Estamos esperando a confirmação do Mercado Pago. Pode levar alguns segundos.</T>
          {payment.checkout_url ? (
            <Button variant="ghost" onPress={() => WebBrowser.openAuthSessionAsync(payment.checkout_url!, `uairole://pagamento/${id}`).then(() => verify())}>
              <Row>
                <Icon icon={CreditCard} size={18} />
                <T weight="semibold">Abrir o pagamento de novo (Mercado Pago)</T>
              </Row>
            </Button>
          ) : null}
        </Card>
      ) : (
        <Loading />
      )}

      {err ? <ErrorBox message={err} /> : null}
      {payment.status === "pendente" && TEST_MODE ? (
        <Card style={{ borderColor: `${C.warn}66`, backgroundColor: `${C.warn}14` }}>
          <Row>
            <Icon icon={FlaskConical} size={16} color={C.warn} />
            <T size={13} weight="semibold">Modo de teste</T>
          </Row>
          <T size={13} color={C.muted}>No ambiente de testes do Mercado Pago o Pix não pode ser pago de verdade.</T>
          <Button variant="ghost" loading={busy} onPress={simulate}>Simular pagamento aprovado</Button>
        </Card>
      ) : null}
    </Screen>
  );
}
