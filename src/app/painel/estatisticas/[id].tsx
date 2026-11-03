import { useLocalSearchParams } from "expo-router";
import { Navigation, Ticket } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Icon } from "@/components/icons";
import { Card, ErrorBox, Loading, Row, Screen, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";

type Adv = {
  plan: string;
  hourly: { hour: string; views: number; directions: number; tickets: number }[];
  directions: number;
  tickets: number;
  hoods: { neighborhood: string; views: number }[];
};

/** Estatísticas avançadas (Holofote): visualizações por hora, bairros do público e cliques */
export default function EstatisticasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [a, setA] = useState<Adv | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("event_advanced_stats", { p_event: id });
    if (error) return setErr(errMsg(error));
    setA(data as Adv);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (err) return <Screen padTop={false}><ErrorBox message={err} onRetry={load} /></Screen>;
  if (!a) return <Screen padTop={false}><Loading /></Screen>;
  const hours = a.hourly.slice(-24);
  const maxV = Math.max(1, ...hours.map((h) => h.views));
  const totalHood = Math.max(1, a.hoods.reduce((s, h) => s + h.views, 0));

  return (
    <Screen padTop={false} onRefresh={load}>
      <Row>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Icon icon={Navigation} size={18} color={C.accent} />
          <T size={22} weight="displayBlack">{a.directions}</T>
          <T size={11} color={C.muted} center>cliques em “Como chegar”</T>
        </Card>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Icon icon={Ticket} size={18} color={C.accent} />
          <T size={22} weight="displayBlack">{a.tickets}</T>
          <T size={11} color={C.muted} center>cliques no ingresso</T>
        </Card>
      </Row>
      <Card>
        <T weight="semibold">Visualizações por hora (últimas 24)</T>
        {hours.length === 0 ? (
          <T size={13} color={C.muted}>Ainda sem visualizações.</T>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, gap: 2 }} accessible accessibilityLabel={`Pico de ${maxV} visualizações numa hora`}>
            {hours.map((h) => (
              <View key={h.hour} style={{ flex: 1, height: Math.max(3, (h.views / maxV) * 120), backgroundColor: C.accent, borderRadius: 3 }} />
            ))}
          </View>
        )}
      </Card>
      <Card>
        <T weight="semibold">Bairros do público</T>
        <T size={12} color={C.muted}>Anônimo e agrupado: bairros com poucas visualizações viram “Outros”.</T>
        {a.hoods.length === 0 ? <T size={13} color={C.muted}>Ainda sem dados.</T> : null}
        {a.hoods.slice(0, 10).map((h) => (
          <View key={h.neighborhood} style={{ gap: 4 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T size={13}>{h.neighborhood}</T>
              <T size={13} color={C.muted}>{Math.round((h.views / totalHood) * 100)}%</T>
            </Row>
            <View style={{ height: 6, backgroundColor: C.surface2, borderRadius: 3 }}>
              <View style={{ width: `${(h.views / totalHood) * 100}%`, height: 6, backgroundColor: C.accent, borderRadius: 3 }} />
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
