import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { CalendarClock } from "lucide-react-native";
import { Platform, Pressable, View } from "react-native";
import { Icon } from "@/components/icons";
import { Row, T } from "@/components/ui";
import { C, R } from "@/lib/theme";

const TZ = "America/Sao_Paulo";
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

/**
 * Data e hora no horário de Brasília (BH).
 * Android: escolhe a data e depois a hora (janelas do sistema).
 * iPhone: seletor compacto da Apple (funciona até dentro de painéis).
 */
export function DateTimeField({ label, value, onChange, optional }: { label: string; value: Date | null; onChange: (d: Date | null) => void; optional?: boolean }) {
  function openAndroid() {
    DateTimePickerAndroid.open({
      value: value ?? new Date(),
      mode: "date",
      timeZoneName: TZ,
      onChange: (e, d) => {
        if (e.type !== "set" || !d) return;
        DateTimePickerAndroid.open({
          value: d,
          mode: "time",
          is24Hour: true,
          timeZoneName: TZ,
          onChange: (e2, d2) => {
            if (e2.type === "set" && d2) onChange(d2);
          },
        });
      },
    });
  }

  const box = { minHeight: 46, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 14, flexDirection: "row" as const, alignItems: "center" as const, gap: 8 };
  const clear = optional && value ? <T size={13} weight="semibold" color={C.muted} onPress={() => onChange(null)} suppressHighlighting>Limpar</T> : null;

  return (
    <View style={{ gap: 6 }}>
      <T size={13} weight="semibold">{label}</T>
      {Platform.OS === "ios" && value ? (
        <View style={[box, { justifyContent: "space-between" }]}>
          <DateTimePicker value={value} mode="datetime" display="compact" locale="pt-BR" timeZoneName={TZ} themeVariant="dark" accentColor={C.accent} minuteInterval={5} onChange={(_, d) => d && onChange(d)} />
          {clear}
        </View>
      ) : (
        <Pressable
          onPress={() => (Platform.OS === "android" ? openAndroid() : onChange(new Date()))}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? fmt(value) : "escolher"}`}
          style={box}
        >
          <Icon icon={CalendarClock} size={18} color={C.muted} />
          <Row style={{ flex: 1 }}>
            <T size={15} color={value ? C.ink : C.muted}>{value ? fmt(value) : "Escolher data e hora"}</T>
          </Row>
          {clear}
        </Pressable>
      )}
    </View>
  );
}
