import { CATEGORY_ICON } from "@/components/icons";
import { useCallback, useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { NotificationPrefsCard } from "@/components/notification-prefs";
import { Button, Card, Chip, ErrorBox, Input, LinkText, Loading, LoginNeeded, Notice, Row, Screen, T, Toggle, s } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { disablePush, enablePush, savedToken } from "@/lib/push";
import { openSite } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { CATEGORIES, type Category } from "@/lib/types";

type Blocked = { id: string; name: string; avatar_url: string | null };

export default function Privacidade() {
  const { user, profile, refreshProfile } = useAuth();
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [hood, setHood] = useState("");
  const [push, setPush] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [cats, setCats] = useState<Set<Category>>(new Set());
  const [blocked, setBlocked] = useState<Blocked[] | null>(null);

  const loadBlocked = useCallback(async () => {
    const { data } = await supabase.from("blocks").select("blocked_id");
    const ids = (data ?? []).map((b) => b.blocked_id as string);
    if (!ids.length) return setBlocked([]);
    const { data: ps } = await supabase.from("public_profiles").select("id,name,avatar_url").in("id", ids);
    setBlocked((ps ?? []) as Blocked[]);
  }, []);

  useEffect(() => {
    setHood(profile?.home_neighborhood ?? "");
  }, [profile?.home_neighborhood]);

  useEffect(() => {
    if (!user) return;
    savedToken().then((t) => setPush(Boolean(t)));
    supabase
      .from("category_interests")
      .select("category")
      .then(({ data }) => setCats(new Set((data ?? []).map((c) => c.category as Category))));
    loadBlocked();
  }, [user, loadBlocked]);

  if (!user) return <Screen padTop={false}><LoginNeeded /></Screen>;
  if (!profile) return <Screen padTop={false}><Loading /></Screen>;

  async function update(changes: Record<string, unknown>, ok?: string) {
    setError("");
    setMsg("");
    const { error } = await supabase.from("profiles").update(changes).eq("id", profile!.id);
    if (error) return setError(errMsg(error));
    await refreshProfile();
    if (ok) setMsg(ok);
  }

  async function togglePush(v: boolean) {
    setError("");
    setMsg("");
    setPushBusy(true);
    if (v) {
      const r = await enablePush();
      setPushBusy(false);
      if ("error" in r) return setError(r.error);
      setPush(true);
      setMsg("Notificações ligadas neste celular!");
    } else {
      await disablePush().catch(() => {});
      setPushBusy(false);
      setPush(false);
    }
  }

  async function toggleCat(c: Category) {
    const on = cats.has(c);
    const { error } = on
      ? await supabase.from("category_interests").delete().eq("category", c).eq("user_id", profile!.id)
      : await supabase.from("category_interests").insert({ category: c });
    if (error) return setError(errMsg(error));
    setCats((old) => {
      const n = new Set(old);
      if (on) n.delete(c);
      else n.add(c);
      return n;
    });
  }

  async function unblock(id: string) {
    const { error } = await supabase.from("blocks").delete().eq("blocked_id", id).eq("blocker_id", profile!.id);
    if (error) return setError(errMsg(error));
    loadBlocked();
  }

  return (
    <Screen padTop={false}>
      {msg ? <Notice>{msg}</Notice> : null}
      {error ? <ErrorBox message={error} /> : null}

      <Card style={{ gap: 0 }}>
        <T weight="semibold">O que seus amigos veem</T>
        <T size={12} color={C.muted}>Tudo começa desligado. Só seus amigos aceitos veem.</T>
        <Toggle on={Boolean(profile.share_going)} onChange={(v) => update({ share_going: v })} label="Mostrar os rolês em que eu cliquei “Eu vou”" hint="Aparece pros amigos como “Fulano vai”." />
        <View style={s.divider} />
        <Toggle on={Boolean(profile.share_checkins)} onChange={(v) => update({ share_checkins: v })} label="Mostrar onde fiz check-in" hint="Só o nome do evento e só enquanto ele acontece. Nunca sua localização." />
      </Card>
      <T size={12} color={C.muted} style={{ marginTop: -8 }}>O Uai Rolê não compartilha sua localização GPS em tempo real nem guarda histórico de lugares.</T>

      <Card>
        <T weight="semibold">Notificações</T>
        <View style={{ opacity: pushBusy || push === null ? 0.5 : 1 }} pointerEvents={pushBusy ? "none" : "auto"}>
          <Toggle
            on={Boolean(push)}
            onChange={togglePush}
            label="Receber notificações neste celular"
            hint="Escolha abaixo quais tipos de aviso você quer. Sem spam, sô."
          />
        </View>
        {error && /permissão/.test(error) ? <LinkText onPress={() => Linking.openSettings()}>Abrir configurações do celular</LinkText> : null}
        <T size={12} color={C.muted}>Categorias que você curte:</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((c) => {
            const on = cats.has(c.id);
            return (
              <Chip key={c.id} icon={CATEGORY_ICON[c.id]} active={on} onPress={() => toggleCat(c.id)}>
                {c.label}
              </Chip>
            );
          })}
        </View>
      </Card>

      <NotificationPrefsCard />

      <Card>
        <T weight="semibold">Meu bairro (opcional)</T>
        <T size={12} color={C.muted}>Usado só de forma agrupada e anônima nas estatísticas dos organizadores (ex.: “30% do público é da Savassi”). Não é sua localização.</T>
        <Row>
          <View style={{ flex: 1 }}>
            <Input placeholder="Ex.: Santa Tereza" maxLength={60} value={hood} onChangeText={setHood} />
          </View>
          <Button variant="ghost" onPress={() => update({ home_neighborhood: hood.trim() || null }, "Bairro salvo!")}>Salvar</Button>
        </Row>
      </Card>

      <Card>
        <T weight="semibold">Bloqueados</T>
        {!blocked ? (
          <Loading />
        ) : blocked.length === 0 ? (
          <T size={14} color={C.muted}>Você não bloqueou ninguém.</T>
        ) : (
          blocked.map((b) => (
            <Row key={b.id} style={{ gap: 12 }}>
              <Avatar name={b.name} url={b.avatar_url} size={32} />
              <T size={14} style={{ flex: 1 }} numberOfLines={1}>{b.name}</T>
              <LinkText onPress={() => unblock(b.id)}>Desbloquear</LinkText>
            </Row>
          ))
        )}
        <T size={12} color={C.muted}>Quem você bloqueia não vê seu perfil, seus posts e avaliações, e não consegue te mandar pedido. Pra bloquear alguém, abre o perfil da pessoa.</T>
      </Card>

      <T size={12} color={C.muted} center>
        Leia a <LinkText size={12} onPress={() => openSite("/privacidade")}>Política de Privacidade (abre o site)</LinkText>.
      </T>
    </Screen>
  );
}
