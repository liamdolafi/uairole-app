import { router } from "expo-router";
import { PartyPopper } from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icons";
import { LinkText, T } from "@/components/ui";
import { rememberRef, useInviter, useMyRefCode } from "@/lib/referral";
import { C, R } from "@/lib/theme";
import { inviteText, REF_CODE_RE } from "@/lib/types";

/** Evento ou local aberto por um link compartilhado: "Ana te chamou pra esse rolê" */
export function InviteBanner({ refCode }: { refCode?: string | string[] }) {
  const raw = (Array.isArray(refCode) ? refCode[0] : refCode)?.toLowerCase() ?? null;
  const code = raw && REF_CODE_RE.test(raw) ? raw : null;
  const { user, loading } = useAuth();
  const mine = useMyRefCode(!!user);
  const inviter = useInviter(code);

  useEffect(() => {
    if (code && !loading && !user) rememberRef(code);
  }, [code, loading, user]);

  if (!code || !inviter || (mine && mine === code)) return null;
  return (
    <View style={{ gap: 6, padding: 12, borderRadius: R.lg, borderWidth: 1, borderColor: `${C.accent}66`, backgroundColor: C.accentSoft }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon icon={PartyPopper} size={18} color={C.accent} />
        <T weight="semibold" style={{ flex: 1 }}>{inviteText(inviter.first_name)}</T>
      </View>
      {!user && !loading ? <LinkText onPress={() => router.push("/cadastro")}>Criar conta grátis</LinkText> : null}
    </View>
  );
}
