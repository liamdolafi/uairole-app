import { useRef } from "react";
import { Pressable, TextInput, View, type TextInputInstance } from "react-native";
import { C, F, R } from "@/lib/theme";
import { Input } from "./ui";

/** Data no formato DD/MM/AAAA, com as barras automáticas */
export function DateInput({ value, onChange, label, hint }: { value: string; onChange: (v: string) => void; label: string; hint?: string }) {
  function change(t: string) {
    const d = t.replace(/\D/g, "").slice(0, 8);
    let out = d.slice(0, 2);
    if (d.length > 2) out += `/${d.slice(2, 4)}`;
    if (d.length > 4) out += `/${d.slice(4)}`;
    onChange(out);
  }
  return <Input label={label} hint={hint} value={value} onChangeText={change} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} />;
}

/** 6 caixinhas pro código do e-mail. Colar funciona; completa sozinho. */
export function OtpInput({ value, onChange, onComplete, disabled }: { value: string; onChange: (v: string) => void; onComplete: (v: string) => void; disabled?: boolean }) {
  const ref = useRef<TextInputInstance>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const ch = value[i] ?? "";
          const active = i === Math.min(value.length, 5);
          return (
            <View
              key={i}
              style={{
                width: 46,
                height: 56,
                borderRadius: R.md,
                borderWidth: 2,
                borderColor: active && !disabled ? C.accent : C.line,
                backgroundColor: C.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TextInput editable={false} pointerEvents="none" value={ch} style={{ color: C.ink, fontFamily: F.bold, fontSize: 24 }} />
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        autoFocus
        editable={!disabled}
        onChangeText={(t) => {
          const d = t.replace(/\D/g, "").slice(0, 6);
          onChange(d);
          if (d.length === 6) onComplete(d);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        caretHidden
        style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.02, color: "transparent" }}
      />
    </Pressable>
  );
}
