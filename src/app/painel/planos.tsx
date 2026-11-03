import { router } from "expo-router";
import { CalendarDays, CalendarRange, Check, ExternalLink, Flame, Gift, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { HolofoteIcon, Icon } from "@/components/icons";
import { MyPlan } from "@/components/my-plan";
import { Button, Card, Loading, Row, Screen, Sheet, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { useAppConfig } from "@/lib/app-config";
import { formatReais } from "@/lib/format";
import { openSite } from "@/lib/site";
import { C, R } from "@/lib/theme";
import { PLAN_FEATURES, PLAN_LABEL, planPrice, type Plan, type PlanPeriod } from "@/lib/types";

type Paid = "destaque" | "holofote";
const ICON: Record<Plan, React.ReactNode> = {
  gratis: <Icon icon={Sparkles} size={18} color={C.muted} />,
  destaque: <Icon icon={Flame} size={18} color={C.warn} />,
  holofote: <HolofoteIcon size={18} color={C.accent} />,
};

/**
 * Planos para organizadores. O "Assinar" leva pra página de pagamento:
 * por padrão a do site, no navegador; se o admin liberou (Sócios → Config.), a do próprio app.
 */
export default function PlanosScreen() {
  const { profile } = useAuth();
  const { info, planPurchase } = useAppConfig();
  const [sheet, setSheet] = useState<Paid | null>(null);

  if (!profile) return <Screen padTop={false}><Loading /></Screen>;

  function go(plan: Paid, period: PlanPeriod) {
    setSheet(null);
    if (planPurchase) router.push({ pathname: "/painel/assinar", params: { plano: plan, periodo: period } });
    else openSite(`/planos/assinar?plano=${plan}&periodo=${period}`);
  }

  return (
    <Screen padTop={false}>
      <Card>
        <MyPlan userId={profile.id} />
      </Card>
      <T size={14} color={C.muted}>Publicar é sempre grátis. Com um plano, seu rolê aparece mais.</T>

      {info.launch_remaining > 0 ? (
        <Card style={{ borderColor: `${C.warn}66`, backgroundColor: `${C.warn}14` }}>
          <Row>
            <Icon icon={Gift} size={18} color={C.warn} />
            <T weight="semibold">Oferta de lançamento</T>
          </Row>
          <T size={13}>Os {info.launch_slots} primeiros parceiros ganham 1 mês de Destaque grátis. Restam {info.launch_remaining} vagas. Fala com a gente!</T>
        </Card>
      ) : null}

      {(["gratis", "destaque", "holofote"] as Plan[]).map((p) => (
        <View
          key={p}
          style={{ padding: 16, gap: 8, borderRadius: R.xl, borderWidth: 1, borderColor: p === "holofote" ? C.accent : p === "destaque" ? `${C.warn}88` : C.line, backgroundColor: p === "holofote" ? C.accentSoft : C.surface }}
        >
          <Row>
            {ICON[p]}
            <T size={20} weight="display" style={{ flex: 1 }}>{PLAN_LABEL[p]}</T>
          </Row>
          {p === "gratis" ? (
            <T size={26} weight="displayBlack">R$ 0</T>
          ) : (
            <View>
              <T size={26} weight="displayBlack">{formatReais(planPrice(info, p, "evento"))}</T>
              <T size={13} color={C.muted}>por evento · ou {formatReais(planPrice(info, p, "mensal"))} por mês</T>
            </View>
          )}
          {PLAN_FEATURES[p].map((i) => (
            <Row key={i} style={{ alignItems: "flex-start" }}>
              <Icon icon={Check} size={16} color={C.ok} />
              <T size={13} style={{ flex: 1 }}>{i}</T>
            </Row>
          ))}
          {p !== "gratis" ? (
            <Button variant={p === "holofote" ? "primary" : "ghost"} onPress={() => setSheet(p)} accessibilityLabel={`Assinar ${PLAN_LABEL[p]}`}>
              Assinar
            </Button>
          ) : null}
        </View>
      ))}

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet ? `Assinar ${PLAN_LABEL[sheet]}` : ""}>
        {sheet
          ? (
              [
                ["evento", "Só este evento", "Vale até o fim do evento escolhido.", CalendarDays],
                ["mensal", "Mensal", "30 dias pra todos os seus eventos.", CalendarRange],
              ] as const
            ).map(([id, t, sub, ic]) => (
              <Pressable key={id} onPress={() => go(sheet, id)} accessibilityRole="button" style={{ flexDirection: "row", gap: 10, padding: 12, minHeight: 44, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface2 }}>
                <Icon icon={ic} size={20} color={C.accent} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                    <T weight="semibold">{t}</T>
                    <T weight="display">{formatReais(planPrice(info, sheet, id))}{id === "mensal" ? "/mês" : ""}</T>
                  </Row>
                  <T size={12} color={C.muted}>{sub}</T>
                </View>
              </Pressable>
            ))
          : null}
        {!planPurchase ? (
          <Row style={{ alignItems: "flex-start" }}>
            <Icon icon={ExternalLink} size={14} color={C.muted} />
            <T size={12} color={C.muted} style={{ flex: 1 }}>A página de pagamento abre no site, no navegador (entre com a mesma conta).</T>
          </Row>
        ) : null}
      </Sheet>
    </Screen>
  );
}
