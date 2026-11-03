import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react-native";
import { CircleAlert, Compass, LockKeyhole, X } from "lucide-react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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
import { C, F, R, TOUCH } from "@/lib/theme";
import { Icon } from "./icons";

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
  const bg = { primary: C.accentStrong, ghost: C.surface2, outline: "transparent", danger: C.danger, ok: `${C.ok}33` }[variant];
  const fg = { primary: C.white, ghost: C.ink, outline: C.ink, danger: C.white, ok: C.ok }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      {...p}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight: small ? TOUCH : 48,
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

export function Chip({ active, onPress, children, icon }: { active?: boolean; onPress: () => void; children: ReactNode; icon?: LucideIcon }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={{
        height: TOUCH,
        paddingHorizontal: 15,
        borderRadius: R.full,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: active ? C.accentStrong : C.surface,
        borderWidth: 1,
        borderColor: active ? C.accentStrong : C.line,
      }}
    >
      {icon ? <Icon icon={icon} size={16} color={active ? C.white : C.ink} /> : null}
      <T size={14} weight="semibold" color={active ? C.white : C.ink}>
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
      <Row>
        <Icon icon={CircleAlert} size={16} color={C.danger} />
        <T size={14} weight="semibold" color={C.danger}>Ih, deu ruim</T>
      </Row>
      <T size={14}>{message}</T>
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

/** Bloco cinza animado (carregando) */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const [v] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v]);
  return <Animated.View style={[{ backgroundColor: C.surface2, borderRadius: R.md, opacity: v }, style]} />;
}

/** Esqueleto de cards de rolê */
export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }} accessibilityLabel="Carregando" accessible>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[s.card, { padding: 0, overflow: "hidden" }]}>
          <Skeleton style={{ height: 150, borderRadius: 0 }} />
          <View style={{ padding: 14, gap: 8 }}>
            <Skeleton style={{ height: 12, width: "35%" }} />
            <Skeleton style={{ height: 18, width: "75%" }} />
            <Skeleton style={{ height: 12, width: "50%" }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Esqueleto de lista simples */
export function RowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 8 }} accessibilityLabel="Carregando" accessible>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[s.card, { flexDirection: "row", alignItems: "center", padding: 12 }]}>
          <Skeleton style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 12, width: "65%" }} />
            <Skeleton style={{ height: 12, width: "35%" }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Carregando: blocos cinza no formato da tela */
export function Loading({ variant = "rows" }: { text?: string; variant?: "rows" | "cards" | "page" }) {
  if (variant === "cards") return <CardsSkeleton />;
  if (variant === "page")
    return (
      <View style={{ gap: 12 }} accessibilityLabel="Carregando" accessible>
        <Skeleton style={{ height: 220, borderRadius: R.xl }} />
        <Skeleton style={{ height: 26, width: "75%" }} />
        <Skeleton style={{ height: 14, width: "50%" }} />
        <Skeleton style={{ height: 90 }} />
      </View>
    );
  return <RowsSkeleton />;
}

/** Ilustração dos estados vazios: ícone grande num círculo com brilhos */
export function EmptyArt({ icon }: { icon: LucideIcon }) {
  return (
    <View style={{ width: 112, height: 112, alignItems: "center", justifyContent: "center", marginBottom: 4 }} importantForAccessibility="no-hide-descendants">
      <Svg width={112} height={112} viewBox="0 0 112 112" style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="45%" r="55%">
            <Stop offset="0%" stopColor="#ff2e88" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#ff2e88" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={56} cy={56} r={56} fill="url(#g)" />
        <Circle cx={56} cy={56} r={34} fill={C.surface2} stroke={C.line} strokeWidth={2} />
        <Path d="M92 18Q92 26 100 26Q92 26 92 34Q92 26 84 26Q92 26 92 18Z" fill={C.warn} />
        <Path d="M20 78Q20 84 26 84Q20 84 20 90Q20 84 14 84Q20 84 20 78Z" fill={C.ok} />
        <Circle cx={20} cy={28} r={3} fill={C.orange} />
        <Circle cx={94} cy={86} r={3.5} fill={C.ink} opacity={0.7} />
      </Svg>
      <Icon icon={icon} size={34} color={C.accent} />
    </View>
  );
}

export function Empty({ icon = Compass, title, children }: { icon?: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <View style={{ paddingVertical: 32, alignItems: "center", gap: 8 }}>
      <EmptyArt icon={icon} />
      <T size={18} weight="display" center>{title}</T>
      {typeof children === "string" ? <T size={14} color={C.muted} center>{children}</T> : children}
    </View>
  );
}

export function LoginNeeded({ text = "Entra na sua conta pra continuar." }: { text?: string }) {
  return (
    <Empty icon={LockKeyhole} title="Bora entrar?">
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
  onRefresh,
  padTop = true,
  contentStyle,
}: {
  children: ReactNode;
  refreshControl?: React.ComponentProps<typeof ScrollView>["refreshControl"];
  /** puxar pra atualizar */
  onRefresh?: () => unknown;
  padTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const pull = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl ?? (pull ? <RefreshControl refreshing={refreshing} onRefresh={pull} tintColor={C.accent} colors={[C.accent]} /> : undefined)}
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
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar" style={{ width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center", marginRight: -10 }}>
              <Icon icon={X} size={22} color={C.muted} />
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
