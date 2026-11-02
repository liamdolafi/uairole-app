import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F, R } from "@/lib/theme";

// ===== Texto =====
type TProps = TextProps & {
  size?: number;
  weight?: "regular" | "medium" | "semibold" | "bold" | "display" | "displayBlack";
  color?: string;
  center?: boolean;
};
export function T({ size = 15, weight = "regular", color = C.ink, center, style, ...p }: TProps) {
  return <Text {...p} style={[{ fontFamily: F[weight], fontSize: size, color, textAlign: center ? "center" : undefined }, style]} />;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <T size={28} weight="displayBlack" style={{ lineHeight: 32 }}>
        {children}
      </T>
      {sub ? <T color={C.muted} size={14}>{sub}</T> : null}
    </View>
  );
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <T size={18} weight="display" style={style}>
      {children}
    </T>
  );
}

// ===== Botões =====
type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline" | "danger" | "ok";
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};
export function Button({ children, variant = "primary", loading, small, disabled, style, ...p }: ButtonProps) {
  const bg = { primary: C.accent, ghost: C.surface2, outline: "transparent", danger: C.danger, ok: `${C.ok}33` }[variant];
  const fg = { primary: C.white, ghost: C.ink, outline: C.ink, danger: C.white, ok: C.ok }[variant];
  return (
    <Pressable
      {...p}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: small ? 34 : 46,
          paddingHorizontal: small ? 12 : 18,
          borderRadius: R.md,
          backgroundColor: bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: C.line,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : typeof children === "string" ? <T weight="semibold" size={small ? 13 : 15} color={fg}>{children}</T> : children}
    </Pressable>
  );
}

export function LinkText({ children, onPress, color = C.accent, size = 14 }: { children: ReactNode; onPress: () => void; color?: string; size?: number }) {
  return (
    <T weight="semibold" size={size} color={color} onPress={onPress} suppressHighlighting>
      {children}
    </T>
  );
}

export function Chip({ active, onPress, children }: { active?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: R.full,
        justifyContent: "center",
        backgroundColor: active ? C.accent : C.surface,
        borderWidth: 1,
        borderColor: active ? C.accent : C.line,
      }}
    >
      <T size={13} weight="semibold" color={active ? C.white : C.ink}>
        {children}
      </T>
    </Pressable>
  );
}

/** Linha de chips que rola pro lado */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
      {children}
    </ScrollView>
  );
}

// ===== Campos =====
export function Input({ label, hint, style, ...p }: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <T size={13} weight="semibold">{label}</T> : null}
      <TextInput
        placeholderTextColor={`${C.muted}aa`}
        selectionColor={C.accent}
        {...p}
        style={[
          {
            minHeight: 46,
            borderRadius: R.md,
            borderWidth: 1,
            borderColor: C.line,
            backgroundColor: C.surface,
            color: C.ink,
            paddingHorizontal: 14,
            fontFamily: F.regular,
            fontSize: 15,
          },
          p.multiline ? { minHeight: 90, paddingTop: 12, textAlignVertical: "top" } : null,
          style,
        ]}
      />
      {hint ? <T size={12} color={C.muted}>{hint}</T> : null}
    </View>
  );
}

// ===== Avisos =====
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={[s.box, { borderColor: `${C.danger}66`, backgroundColor: `${C.danger}1a` }]}>
      <T size={14} color={C.danger}>{message}</T>
      {onRetry ? <LinkText onPress={onRetry} color={C.ink}>Tentar de novo</LinkText> : null}
    </View>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={[s.box, { borderColor: `${C.accent}55`, backgroundColor: C.accentSoft }]}>
      {typeof children === "string" ? <T size={14}>{children}</T> : children}
    </View>
  );
}

export function Spinner({ small }: { small?: boolean }) {
  return <ActivityIndicator color={C.accent} size={small ? "small" : "large"} />;
}

export function Loading({ text }: { text?: string }) {
  return (
    <View style={{ paddingVertical: 40, alignItems: "center", gap: 10 }}>
      <Spinner />
      {text ? <T color={C.muted} size={14}>{text}</T> : null}
    </View>
  );
}

export function Empty({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <View style={{ paddingVertical: 36, alignItems: "center", gap: 8 }}>
      <T size={44}>{emoji}</T>
      <T size={18} weight="display" center>{title}</T>
      {typeof children === "string" ? <T size={14} color={C.muted} center>{children}</T> : children}
    </View>
  );
}

export function LoginNeeded({ text = "Entra na sua conta pra continuar." }: { text?: string }) {
  return (
    <Empty emoji="🔐" title="Bora entrar?">
      <T size={14} color={C.muted} center>{text}</T>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <Button onPress={() => router.push("/entrar")}>Entrar</Button>
        <Button variant="ghost" onPress={() => router.push("/cadastro")}>Criar conta</Button>
      </View>
    </Empty>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

// ===== Telas =====
/** Tela com rolagem, margem lateral e espaço pro teclado */
export function Screen({
  children,
  refreshControl,
  padTop = true,
  contentStyle,
}: {
  children: ReactNode;
  refreshControl?: React.ComponentProps<typeof ScrollView>["refreshControl"];
  padTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        contentContainerStyle={[{ padding: 16, paddingTop: padTop ? insets.top + 12 : 16, paddingBottom: 40, gap: 18 }, contentStyle]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Painel que sobe de baixo */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: "#000a" }} onPress={onClose} />
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, borderWidth: 1, borderColor: C.line, padding: 20, paddingBottom: insets.bottom + 20, gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <T size={18} weight="display">{title}</T>
            <Pressable onPress={onClose} hitSlop={12}>
              <T size={18} color={C.muted}>✕</T>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <Pressable onPress={() => onChange(!on)} style={{ flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "flex-start" }} accessibilityRole="switch" accessibilityState={{ checked: on }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={14} weight="semibold">{label}</T>
        {hint ? <T size={12} color={C.muted}>{hint}</T> : null}
      </View>
      <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: on ? C.accent : C.line, padding: 3, alignItems: on ? "flex-end" : "flex-start" }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.white }} />
      </View>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}>{children}</View>;
}

export const s = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: R.lg, padding: 12, gap: 6 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 16, gap: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.line },
});
