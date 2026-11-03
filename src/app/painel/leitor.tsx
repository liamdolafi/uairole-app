import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { Camera, CircleCheck, CircleX } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Linking, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, ErrorBox, Input, Row, Screen, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { VALIDATE_LABEL, type ValidateResult } from "@/lib/types";

/** Leitor de QR code na entrada: cada ingresso vale uma vez */
export default function LeitorScreen() {
  const { evento } = useLocalSearchParams<{ evento?: string }>();
  const [perm, requestPerm] = useCameraPermissions();
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");
  const busy = useRef(false);
  const last = useRef({ code: "", at: 0 });

  const check = useCallback(
    async (code: string) => {
      if (busy.current) return;
      // a câmera lê o mesmo QR várias vezes por segundo: ignora repetição em 3 s
      if (last.current.code === code && Date.now() - last.current.at < 3000) return;
      busy.current = true;
      last.current = { code, at: Date.now() };
      const { data, error } = await supabase.rpc("validate_ticket", { p_code: code, p_event: evento ?? null });
      busy.current = false;
      if (error) return setErr(errMsg(error));
      setErr("");
      const r = data as ValidateResult;
      setResult(r);
      Haptics.notificationAsync(r.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
    [evento],
  );

  return (
    <Screen padTop={false}>
      <T size={14} color={C.muted}>Aponte a câmera pro QR code do ingresso. {evento ? "Só valem ingressos deste evento." : "Valem ingressos de todos os seus eventos."}</T>
      <View style={{ aspectRatio: 1, borderRadius: R.xl, overflow: "hidden", backgroundColor: "#000", borderWidth: 1, borderColor: C.line }}>
        {perm?.granted ? (
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={(r) => r.data && check(r.data.trim())} />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
            <Icon icon={Camera} size={40} color={C.muted} />
            <T size={14} color={C.muted} center>O Uai Rolê usa a câmera só pra ler os QR codes dos ingressos. Nada é gravado.</T>
            {perm && !perm.canAskAgain ? (
              <Button onPress={() => Linking.openSettings()}>Liberar câmera nas configurações</Button>
            ) : (
              <Button onPress={requestPerm}>Abrir a câmera</Button>
            )}
          </View>
        )}
      </View>
      {err ? <ErrorBox message={err} /> : null}
      {result ? (
        <Card style={{ alignItems: "center", borderColor: result.ok ? `${C.ok}88` : `${C.danger}88`, backgroundColor: result.ok ? `${C.ok}26` : `${C.danger}26` }}>
          <Icon icon={result.ok ? CircleCheck : CircleX} size={48} color={result.ok ? C.ok : C.danger} />
          <T size={24} weight="displayBlack" center accessibilityLiveRegion="assertive">{VALIDATE_LABEL[result.status]}</T>
          {result.type_name ? (
            <T size={15} center>
              {result.type_name}
              {result.half ? " · MEIA: confira o documento" : ""}
              {result.owner ? ` · ${result.owner}` : ""}
            </T>
          ) : null}
          {result.status === "usado" && result.used_at ? <T size={12} color={C.muted}>Usado em {new Date(result.used_at).toLocaleString("pt-BR")}</T> : null}
          {result.status === "outro_evento" && result.event_title ? <T size={12} color={C.muted}>É do evento “{result.event_title}”.</T> : null}
        </Card>
      ) : null}
      <Card>
        <T size={13} weight="semibold">Digitar o código</T>
        <Row style={{ alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Input value={manual} onChangeText={setManual} autoCapitalize="none" autoCorrect={false} placeholder="Código do ingresso" accessibilityLabel="Código do ingresso" />
          </View>
          <Button variant="ghost" onPress={() => manual.trim() && check(manual.trim())}>Validar</Button>
        </Row>
      </Card>
    </Screen>
  );
}
