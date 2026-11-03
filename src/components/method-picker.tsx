import { CreditCard, QrCode, WalletCards } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/icons";
import { T } from "@/components/ui";
import { C, R } from "@/lib/theme";
import type { PayChoice } from "@/lib/types";

/** Pix, cartão de crédito ou cartão de débito. O cartão é digitado só na página do Mercado Pago. */
export function MethodPicker({ value, onChange }: { value: PayChoice; onChange: (m: PayChoice) => void }) {
  const opts = [
    { id: "pix" as const, title: "Pix", sub: "QR code ou copia e cola. Confirma na hora.", icon: QrCode },
    { id: "credito" as const, title: "Cartão de crédito", sub: "Digitado na página segura do Mercado Pago.", icon: CreditCard },
    { id: "debito" as const, title: "Cartão de débito", sub: "Digitado na página segura do Mercado Pago.", icon: WalletCards },
  ];
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup">
      {opts.map((o) => {
        const on = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={{ flexDirection: "row", gap: 12, padding: 12, minHeight: 44, borderRadius: R.lg, borderWidth: 1, borderColor: on ? C.accent : C.line, backgroundColor: on ? C.accentSoft : C.surface }}
          >
            <Icon icon={o.icon} size={20} color={C.accent} />
            <View style={{ flex: 1 }}>
              <T weight="semibold">{o.title}</T>
              <T size={12} color={C.muted}>{o.sub}</T>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
