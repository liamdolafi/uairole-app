import { router } from "expo-router";
import { ChartColumn, CalendarPlus, Check, Hourglass, MapPin, QrCode, Sparkles, Ticket } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Icon, HolofoteIcon } from "@/components/icons";
import { Button, Card, ErrorBox, Notice, PageTitle, Row, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { useAppConfig } from "@/lib/app-config";
import { errMsg, formatReais } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";

const PERKS = [
  { icon: CalendarPlus, text: "Publique festas, shows, peladas e feiras de graça, quantos quiser" },
  { icon: MapPin, text: "Seu local no mapa, com página própria e cardápio" },
  { icon: Ticket, text: "Com Destaque ou Holofote: venda ingressos pelo app (Pix e cartão) ou use seu link" },
  { icon: QrCode, text: "Leitor de QR code na entrada, direto no celular" },
  { icon: ChartColumn, text: "Veja visualizações, “Eu vou”, favoritos e check-ins" },
];

/** Aba Painel pra quem ainda não é organizador */
export function BecomeOrganizer() {
  const { user, profile, refreshProfile } = useAuth();
  const { info } = useAppConfig();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function ask() {
    if (!profile) return;
    setBusy(true);
    setErr("");
    const { error } = await supabase.from("profiles").update({ organizer_request: true }).eq("id", profile.id);
    setBusy(false);
    if (error) return setErr(errMsg(error));
    await refreshProfile();
  }

  return (
    <>
      <PageTitle sub="Organiza rolê em BH? Publica aqui, sô.">Seja organizador</PageTitle>
      <Card>
        {PERKS.map((p) => (
          <Row key={p.text} style={{ alignItems: "flex-start" }}>
            <Icon icon={p.icon} size={18} color={C.accent} />
            <T size={14} style={{ flex: 1 }}>{p.text}</T>
          </Row>
        ))}
      </Card>

      <Card>
        <T weight="semibold">Planos para organizadores</T>
        <T size={13} color={C.muted}>Publicar é sempre grátis. Quer aparecer mais?</T>
        <Row style={{ alignItems: "flex-start" }}>
          <Icon icon={Sparkles} size={18} color={C.warn} />
          <View style={{ flex: 1 }}>
            <T size={14} weight="semibold">Destaque · {formatReais(info.destaque_evento)} por evento ou {formatReais(info.destaque_mensal)}/mês</T>
            <T size={12} color={C.muted}>Topo da lista, selo Destaque e pino maior no mapa.</T>
          </View>
        </Row>
        <Row style={{ alignItems: "flex-start" }}>
          <HolofoteIcon size={18} color={C.accent} />
          <View style={{ flex: 1 }}>
            <T size={14} weight="semibold">Holofote · {formatReais(info.holofote_evento)} por evento ou {formatReais(info.holofote_mensal)}/mês</T>
            <T size={12} color={C.muted}>Carrossel “Em destaque”, pino com brilho, notificação pros seguidores, post fixado e estatísticas avançadas.</T>
          </View>
        </Row>
      </Card>

      {err ? <ErrorBox message={err} /> : null}
      {!user ? (
        <Card>
          <T size={14} color={C.muted}>Primeiro entre na sua conta (ou crie uma, é rapidinho).</T>
          <Row>
            <Button style={{ flex: 1 }} onPress={() => router.push("/entrar")}>Entrar</Button>
            <Button style={{ flex: 1 }} variant="ghost" onPress={() => router.push("/cadastro")}>Criar conta</Button>
          </Row>
        </Card>
      ) : profile?.organizer_request ? (
        <Notice>
          <Row>
            <Icon icon={Hourglass} size={16} color={C.warn} />
            <T size={14} style={{ flex: 1 }}>Seu pedido tá em análise. Assim que aprovarem, o Painel aparece aqui.</T>
          </Row>
        </Notice>
      ) : (
        <Button loading={busy} onPress={ask}>
          <Row>
            <Icon icon={Check} size={18} color={C.white} />
            <T weight="semibold" color={C.white}>Quero ser organizador</T>
          </Row>
        </Button>
      )}
    </>
  );
}
