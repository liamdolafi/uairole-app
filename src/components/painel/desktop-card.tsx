import * as Clipboard from "expo-clipboard";
import { Monitor } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, Row, T } from "@/components/ui";
import { openSite, siteLink } from "@/lib/site";
import { C } from "@/lib/theme";

/** Admin e Sócios e finanças continuam no site: aqui só explica e dá o link */
export function DesktopCard({ admin, socio }: { admin: boolean; socio: boolean }) {
  const [copied, setCopied] = useState("");
  const areas = [admin ? { path: "/admin", label: "Admin" } : null, admin || socio ? { path: "/socios", label: "Sócios e finanças" } : null].filter(Boolean) as { path: string; label: string }[];
  if (!areas.length) return null;
  return (
    <Card>
      <Row>
        <Icon icon={Monitor} size={18} color={C.accent} />
        <T weight="semibold">Abrir no computador</T>
      </Row>
      <T size={13} color={C.muted}>
        {areas.map((a) => a.label).join(" e ")} {areas.length > 1 ? "funcionam" : "funciona"} melhor no site, num computador: têm tabelas, gráficos e relatórios grandes.
      </T>
      {areas.map((a) => (
        <View key={a.path} style={{ gap: 6 }}>
          <T size={13} weight="semibold">{a.label}: {siteLink(a.path).replace(/^https?:\/\//, "")}</T>
          <Row>
            <Button
              small
              variant="ghost"
              style={{ flex: 1 }}
              onPress={async () => {
                await Clipboard.setStringAsync(siteLink(a.path));
                setCopied(a.path);
              }}
            >
              {copied === a.path ? "Link copiado!" : "Copiar link"}
            </Button>
            <Button small variant="outline" style={{ flex: 1 }} onPress={() => openSite(a.path)}>Abrir no navegador</Button>
          </Row>
        </View>
      ))}
    </Card>
  );
}
