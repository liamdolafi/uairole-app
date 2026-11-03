import { Clock, Mail, MessageCircle } from "lucide-react-native";
import { Linking, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, Row, T } from "@/components/ui";
import { CONTACT_EMAIL, whatsappLink } from "@/lib/site";
import { C } from "@/lib/theme";

/** "O pagamento online chega em breve": contato por WhatsApp e e-mail. Nada foi cobrado. */
export function SoonBox({ message, contactText, note }: { message: string; contactText: string; note?: string }) {
  const wa = whatsappLink(contactText);
  return (
    <Card style={{ borderColor: `${C.warn}66`, backgroundColor: `${C.warn}14` }}>
      <Row style={{ alignItems: "flex-start" }}>
        <Icon icon={Clock} size={18} color={C.warn} />
        <T weight="semibold" style={{ flex: 1 }} accessibilityLiveRegion="polite">{message}</T>
      </Row>
      {note ? <T size={13} color={C.muted}>{note}</T> : null}
      <View style={{ gap: 8 }}>
        {wa ? (
          <Button onPress={() => Linking.openURL(wa)} accessibilityHint="Abre o WhatsApp">
            <Row>
              <Icon icon={MessageCircle} size={18} color={C.white} />
              <T weight="semibold" color={C.white}>WhatsApp</T>
            </Row>
          </Button>
        ) : null}
        <Button variant="ghost" onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Plano Uai Rolê")}&body=${encodeURIComponent(contactText)}`)} accessibilityHint="Abre o e-mail">
          <Row style={{ flexShrink: 1 }}>
            <Icon icon={Mail} size={18} />
            <T weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>{CONTACT_EMAIL}</T>
          </Row>
        </Button>
      </View>
      <T size={12} color={C.muted}>Nada foi cobrado.</T>
    </Card>
  );
}
