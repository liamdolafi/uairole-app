import { Icon } from "@/components/icons";
import { Bell, Camera, ChevronRight, ExternalLink, FileText, Hourglass, Lightbulb, LockKeyhole, ShieldCheck, Ticket, Users, UsersRound, type LucideIcon } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { Button, Card, ErrorBox, Input, LinkText, Loading, LoginNeeded, PageTitle, Row, Screen, T, s } from "@/components/ui";
import { ageFromBirth, errMsg } from "@/lib/format";
import { askPhotoSource, uploadPhoto } from "@/lib/photos";
import { disablePush } from "@/lib/push";
import { openSite } from "@/lib/site";
import { useMyReferralCount } from "@/lib/referral";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";

const ROLE_LABEL = { usuario: "Usuário", organizador: "Organizador", admin: "Admin", socio: "Sócio" } as const;

export default function Perfil() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const brought = useMyReferralCount(!!user);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"" | "name" | "photo" | "out">("");
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);

  // contadores: avisos não lidos e pedidos de amizade
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .then(({ count, error }) => setUnread(error ? 0 : (count ?? 0)));
      supabase.rpc("my_friends").then(({ data }) => setPending(((data ?? []) as { status: string; incoming: boolean }[]).filter((f) => f.status === "pendente" && f.incoming).length));
    }, [user]),
  );

  if (loading) return <Screen><Loading /></Screen>;
  if (!user) return <Screen><PageTitle>Perfil</PageTitle><LoginNeeded text="Entra pra ver seu perfil, favoritar rolês, fazer check-in e ter amigos aqui." /></Screen>;
  if (!profile) return <Screen><ErrorBox message="Não achamos seu perfil. Tenta sair e entrar de novo." onRetry={refreshProfile} /></Screen>;

  async function saveName() {
    const n = name.trim();
    if (n.length < 2) return setError("Nome muito curto.");
    setBusy("name");
    setError("");
    const { error } = await supabase.from("profiles").update({ name: n }).eq("id", profile!.id);
    setBusy("");
    if (error) return setError(errMsg(error));
    setEditing(false);
    await refreshProfile();
  }

  async function changePhoto() {
    const photo = await askPhotoSource({ square: true });
    if (!photo) return;
    setBusy("photo");
    setError("");
    try {
      const url = await uploadPhoto("avatars", profile!.id, photo, 600);
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile!.id);
      if (error) throw error;
      await refreshProfile();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("");
    }
  }

  function signOut() {
    Alert.alert("Sair da conta?", undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          setBusy("out");
          await disablePush().catch(() => {});
          await supabase.auth.signOut();
          setBusy("");
          router.replace("/");
        },
      },
    ]);
  }

  const age = profile.birth_date ? ageFromBirth(profile.birth_date) : null;

  return (
    <Screen>
      <Row style={{ gap: 16 }}>
        <Pressable onPress={changePhoto} disabled={busy === "photo"} accessibilityLabel="Trocar foto">
          <Avatar name={profile.name} url={profile.avatar_url} size={76} />
          <View style={{ position: "absolute", right: -2, bottom: -2, backgroundColor: C.accentStrong, borderRadius: R.full, padding: 5 }}>
            <Icon icon={busy === "photo" ? Hourglass : Camera} size={13} color={C.white} />
          </View>
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={24} weight="displayBlack" numberOfLines={1}>{profile.name}</T>
          <T size={13} color={C.muted} numberOfLines={1}>{profile.email}</T>
          <Row style={{ marginTop: 4 }}>
            <View style={{ backgroundColor: C.accentSoft, borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 2 }}>
              <T size={12} weight="semibold" color={C.accent}>{ROLE_LABEL[profile.role]}</T>
            </View>
            {age !== null ? (
              <View style={{ backgroundColor: C.surface2, borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                <T size={12} color={C.muted}>{age} anos</T>
              </View>
            ) : null}
          </Row>
        </View>
      </Row>

      {error ? <ErrorBox message={error} /> : null}

      <Card style={{ padding: 0, gap: 0 }}>
        <MenuRow icon={Ticket} label="Meus ingressos" onPress={() => router.push("/ingressos")} />
        <View style={s.divider} />
        <MenuRow icon={Lightbulb} label="Sugerir um evento" onPress={() => router.push("/sugerir")} />
        <View style={s.divider} />
        <MenuRow icon={Users} label="Amigos" badge={pending} onPress={() => router.push("/amigos")} />
        <View style={s.divider} />
        <MenuRow icon={Bell} label="Avisos" badge={unread} onPress={() => router.push("/avisos")} />
        <View style={s.divider} />
        <MenuRow icon={ShieldCheck} label="Privacidade e notificações" onPress={() => router.push("/privacidade")} />
      </Card>

      {brought !== null ? (
        <Card>
          <Row style={{ alignItems: "flex-start" }}>
            <Icon icon={UsersRound} size={18} color={C.accent} />
            <T weight="semibold" style={{ flex: 1 }}>
              {brought === 0 ? "Você ainda não trouxe ninguém pro Uai Rolê" : `Você trouxe ${brought} ${brought === 1 ? "pessoa" : "pessoas"} pro Uai Rolê`}
            </T>
          </Row>
          <T size={13} color={C.muted}>Compartilha um rolê ou um local daqui: quem criar conta pelo seu link conta pra você.</T>
        </Card>
      ) : null}

      <Card>
        <T weight="semibold">Seus dados</T>
        {editing ? (
          <View style={{ gap: 10 }}>
            <Input label="Nome" value={name} maxLength={80} onChangeText={setName} autoFocus />
            <Row>
              <Button onPress={saveName} loading={busy === "name"}>Salvar</Button>
              <Button variant="ghost" onPress={() => setEditing(false)}>Cancelar</Button>
            </Row>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T size={14} color={C.muted}>Nome</T>
              <T size={14}>
                {profile.name}{"  "}
                <LinkText
                  onPress={() => {
                    setName(profile.name);
                    setEditing(true);
                  }}
                >
                  editar
                </LinkText>
              </T>
            </Row>
            <Row style={{ justifyContent: "space-between" }}>
              <T size={14} color={C.muted}>Nascimento</T>
              <T size={14}>{profile.birth_date ? profile.birth_date.split("-").reverse().join("/") : "Não informada"}</T>
            </Row>
          </View>
        )}
      </Card>

      <Card style={{ padding: 0, gap: 0 }}>
        <MenuRow icon={FileText} label="Termos de Uso" external onPress={() => openSite("/termos")} />
        <View style={s.divider} />
        <MenuRow icon={LockKeyhole} label="Política de Privacidade" external onPress={() => openSite("/privacidade")} />
      </Card>

      <Button variant="danger" onPress={signOut} loading={busy === "out"}>Sair</Button>
    </Screen>
  );
}

function MenuRow({ icon, label, onPress, badge, accent, external }: { icon: LucideIcon; label: string; onPress: () => void; badge?: number; accent?: boolean; external?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={external ? "link" : "button"}
      accessibilityLabel={badge ? `${label}, ${badge} novos` : external ? `${label}, abre o site` : label}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, minHeight: 52, backgroundColor: pressed ? C.surface2 : "transparent" })}
    >
      <Icon icon={icon} size={20} color={accent ? C.accent : C.ink} />
      <T size={15} weight={accent ? "semibold" : "regular"} color={accent ? C.accent : C.ink} style={{ flex: 1 }}>{label}</T>
      {badge ? (
        <View style={{ backgroundColor: C.accentStrong, borderRadius: R.full, minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, alignItems: "center" }}>
          <T size={11} weight="bold" color={C.white}>{badge > 9 ? "9+" : badge}</T>
        </View>
      ) : null}
      {external ? (
        <Row style={{ gap: 4 }}>
          <T size={12} color={C.muted}>abre o site</T>
          <Icon icon={ExternalLink} size={14} color={C.muted} />
        </Row>
      ) : (
        <Icon icon={ChevronRight} size={16} color={C.muted} />
      )}
    </Pressable>
  );
}
