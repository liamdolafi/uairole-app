import QRCode from "react-native-qrcode-svg";
import { View } from "react-native";

/** QR code em fundo branco (bom de ler na entrada) */
export function Qr({ value, size = 220, dim }: { value: string; size?: number; dim?: boolean }) {
  return (
    <View style={{ alignSelf: "center", backgroundColor: "#fff", padding: 10, borderRadius: 12, opacity: dim ? 0.3 : 1 }} accessibilityLabel="QR code do ingresso" accessible>
      <QRCode value={value} size={size} backgroundColor="#ffffff" color="#000000" ecl="M" />
    </View>
  );
}
