import { router } from "expo-router";
import { CirclePause, Lock, Sparkles } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Row, T } from "@/components/ui";
import { useAppConfig } from "@/lib/app-config";
import { openRenew } from "@/lib/ticket-sales";
import { C, R } from "@/lib/theme";
import { TICKET_LINK_PAUSED_EXPLAIN, TICKET_PAUSED_EXPLAIN, TICKET_PLAN_BADGE, TICKET_PLAN_EXPLAIN, type Plan } from "@/lib/types";

/** Selo "Destaque ou Holofote" ao lado de "Vender pelo Uai Rolê" */
export function TicketPlanBadge() {
  return (
    <View style={{ alignSelf: "flex-start", maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 4, borderRadius: R.full, backgroundColor: C.accentSoft, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Icon icon={Sparkles} size={12} color={C.accent} />
      <T size={11} weight="bold" color={C.accent} numberOfLines={1} style={{ flexShrink: 1 }}>{TICKET_PLAN_BADGE}</T>
    </View>
  );
}

/** Sem plano: venda bloqueada, com explicação e "Ver planos" */
export function TicketLocked({ eventId }: { eventId?: string | null }) {
  const { planPurchase } = useAppConfig();
  return (
    <View style={{ gap: 8, padding: 12, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface }}>
      <Row style={{ alignItems: "flex-start" }}>
        <Icon icon={Lock} size={16} color={C.muted} />
        <T size={13} style={{ flex: 1 }}>{TICKET_PLAN_EXPLAIN}</T>
      </Row>
      <Button variant="ghost" onPress={() => router.push("/painel/planos")}>Ver planos</Button>
      {eventId ? (
        <Button onPress={() => openRenew(eventId, planPurchase)} accessibilityHint={planPurchase ? undefined : "Abre a página de pagamento no site"}>
          Ativar pra este evento
        </Button>
      ) : null}
    </View>
  );
}

/** Plano acabou: vendas novas pausadas, com o botão de renovar */
export function TicketPaused({ eventId, plan, link }: { eventId: string; plan?: Plan; link?: boolean }) {
  const { planPurchase } = useAppConfig();
  return (
    <View accessibilityRole="alert" style={{ gap: 8, padding: 12, borderRadius: R.lg, borderWidth: 1, borderColor: `${C.warn}66`, backgroundColor: `${C.warn}14` }}>
      <Row>
        <Icon icon={CirclePause} size={18} color={C.warn} />
        <T weight="semibold" color={C.warn} style={{ flex: 1 }}>{link ? "Link de ingresso escondido" : "Vendas pausadas"}</T>
      </Row>
      <T size={13}>{link ? TICKET_LINK_PAUSED_EXPLAIN : TICKET_PAUSED_EXPLAIN}</T>
      <Button onPress={() => openRenew(eventId, planPurchase, plan)} accessibilityHint={planPurchase ? undefined : "Abre a página de pagamento no site"}>
        Renovar plano
      </Button>
    </View>
  );
}
