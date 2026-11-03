import { router, useFocusEffect } from "expo-router";
import { CalendarPlus, ChartColumn, Eye, Hand, Heart, House, MapPin, Pencil, Plus, QrCode, Repeat, Sparkles, Store, Ticket, Users, Wallet, type LucideIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { CATEGORY_ICON, Icon } from "@/components/icons";
import { MyPlan } from "@/components/my-plan";
import { BecomeOrganizer } from "@/components/painel/become-organizer";
import { DesktopCard } from "@/components/painel/desktop-card";
import { Button, Card, Empty, ErrorBox, Loading, PageTitle, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { errMsg, formatWhen } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R, TOUCH } from "@/lib/theme";
import { EVENT_SELECT, PLAN_LABEL, planOf, type EventWithVenue } from "@/lib/types";

type Stats = { event_id: string; views: number; favorites: number; checkins: number; going?: number };

function Action({ icon, label, onPress, hint }: { icon: LucideIcon; label: string; onPress: () => void; hint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => ({ flex: 1, minWidth: "45%", minHeight: 64, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: pressed ? C.surface2 : C.surface, padding: 12, gap: 6, justifyContent: "center" })}
    >
      <Icon icon={icon} size={20} color={C.accent} />
      <T size={13} weight="semibold" numberOfLines={2}>{label}</T>
    </Pressable>
  );
}

/** Aba Painel: organizador cuida dos rolês aqui mesmo no app */
export default function PainelTab() {
  const { user, profile, loading } = useAuth();
  const [events, setEvents] = useState<EventWithVenue[] | null>(null);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [followers, setFollowers] = useState<{ organizer_followers: number; venue_followers: number } | null>(null);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(0);
  const isOrg = profile?.role === "organizador" || profile?.role === "admin";

  const load = useCallback(async () => {
    if (!profile || !isOrg) return;
    const [ev, st, fl] = await Promise.all([
      supabase.from("events").select(EVENT_SELECT).eq("organizer_id", profile.id).order("starts_at", { ascending: false }).limit(100),
      supabase.rpc("my_event_stats"),
      supabase.rpc("my_follower_stats"),
    ]);
    if (ev.error) return setErr(errMsg(ev.error));
    setErr("");
    const map: Record<string, Stats> = {};
    for (const s of (st.data ?? []) as Stats[]) map[s.event_id] = s;
    setStats(map);
    setFollowers(Array.isArray(fl.data) ? (fl.data[0] ?? null) : null);
    setNow(Date.now());
    setEvents((ev.data ?? []) as EventWithVenue[]);
  }, [profile, isOrg]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading || (user && !profile)) return <Screen><Loading variant="page" /></Screen>;

  if (!isOrg)
    return (
      <Screen>
        <BecomeOrganizer />
        {profile ? <DesktopCard admin={false} socio={profile.role === "socio"} /> : null}
      </Screen>
    );

  const totals = Object.values(stats).reduce(
    (t, s) => ({ v: t.v + s.views, f: t.f + s.favorites, c: t.c + s.checkins, g: t.g + (s.going ?? 0) }),
    { v: 0, f: 0, c: 0, g: 0 },
  );
  const upcoming = (events ?? []).filter((e) => new Date(e.ends_at).getTime() > now);
  const past = (events ?? []).filter((e) => new Date(e.ends_at).getTime() <= now);

  return (
    <Screen onRefresh={load}>
      <PageTitle sub="Publicar é sempre grátis, sô!">Painel</PageTitle>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { l: "Visualizações", v: totals.v, i: Eye },
          { l: "Eu vou", v: totals.g, i: Hand },
          { l: "Favoritos", v: totals.f, i: Heart },
          { l: "Check-ins", v: totals.c, i: MapPin },
          { l: "Seguem você", v: followers?.organizer_followers ?? 0, i: Users },
          { l: "Seguem seus locais", v: followers?.venue_followers ?? 0, i: House },
        ].map((x) => (
          <View key={x.l} style={{ width: "31.5%", alignItems: "center", padding: 10, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface }} accessible accessibilityLabel={`${x.l}: ${x.v}`}>
            <Icon icon={x.i} size={16} color={C.accent} />
            <T size={18} weight="displayBlack" numberOfLines={1} adjustsFontSizeToFit>{x.v}</T>
            <T size={10} color={C.muted} center numberOfLines={2}>{x.l}</T>
          </View>
        ))}
      </View>

      <Card>
        <MyPlan userId={profile!.id} />
        <Button variant="ghost" onPress={() => router.push("/painel/planos")}>
          <Row>
            <Icon icon={Sparkles} size={18} color={C.accent} />
            <T weight="semibold">Planos para organizadores</T>
          </Row>
        </Button>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Action icon={Plus} label="Novo evento" onPress={() => router.push({ pathname: "/painel/evento/[id]", params: { id: "novo" } })} />
        <Action icon={Store} label="Meus locais" onPress={() => router.push("/painel/locais")} />
        <Action icon={QrCode} label="Leitor de ingressos" onPress={() => router.push("/painel/leitor")} />
        <Action icon={Wallet} label="Mercado Pago" hint="Conectar a conta que recebe os ingressos" onPress={() => router.push("/painel/mercado-pago")} />
      </View>

      <T size={18} weight="display">Meus eventos</T>
      {err ? <ErrorBox message={err} onRetry={load} /> : null}
      {!events && !err ? <Loading /> : null}
      {events && events.length === 0 ? (
        <Empty icon={CalendarPlus} title="Nenhum evento ainda">
          <T size={14} color={C.muted} center>Primeiro cadastre um local, depois crie seu evento.</T>
          <Button style={{ marginTop: 12 }} onPress={() => router.push("/painel/locais")}>Cadastrar local</Button>
        </Empty>
      ) : null}
      {[...upcoming.reverse(), ...past].map((e) => {
        const s = stats[e.id];
        const ended = new Date(e.ends_at).getTime() <= now;
        const plan = planOf(e);
        return (
          <Card key={e.id} style={{ gap: 8, opacity: ended ? 0.7 : 1 }}>
            <Pressable onPress={() => router.push({ pathname: "/evento/[id]", params: { id: e.id } })} accessibilityRole="link" style={{ gap: 2 }}>
              <Row style={{ gap: 6 }}>
                <Icon icon={CATEGORY_ICON[e.category]} size={13} color={C.muted} />
                <T size={12} color={C.muted} numberOfLines={1} style={{ flex: 1 }}>{formatWhen(e.starts_at, e.ends_at)} · {e.venue?.name}</T>
              </Row>
              <Row style={{ gap: 6 }}>
                {e.series_id ? <Icon icon={Repeat} size={14} color={C.muted} label="Repete" /> : null}
                <T weight="semibold" numberOfLines={2} style={{ flex: 1 }}>{e.title}</T>
              </Row>
            </Pressable>
            <Row style={{ flexWrap: "wrap", gap: 10 }}>
              <T size={12} color={C.muted}>{s?.views ?? e.views} visualizações · {s?.going ?? 0} vão · {s?.checkins ?? 0} check-ins</T>
              {e.status === "cancelado" ? <T size={12} weight="semibold" color={C.danger}>Cancelado</T> : ended ? <T size={12} color={C.muted}>Encerrado</T> : <T size={12} color={C.ok}>Publicado</T>}
              {plan !== "gratis" ? <T size={12} weight="semibold" color={C.accent}>{PLAN_LABEL[plan]}</T> : null}
              {e.price_review && !ended ? <T size={12} weight="semibold" color={C.warn}>Revisar preço</T> : null}
            </Row>
            <Row style={{ flexWrap: "wrap" }}>
              <Button small variant="ghost" onPress={() => router.push({ pathname: "/painel/evento/[id]", params: { id: e.id } })}>
                <Row style={{ gap: 6 }}>
                  <Icon icon={Pencil} size={14} />
                  <T size={13} weight="semibold">Editar</T>
                </Row>
              </Button>
              {e.sells_tickets ? (
                <Button small variant="ghost" onPress={() => router.push({ pathname: "/painel/vendas/[id]", params: { id: e.id } })}>
                  <Row style={{ gap: 6 }}>
                    <Icon icon={Ticket} size={14} />
                    <T size={13} weight="semibold">Vendas</T>
                  </Row>
                </Button>
              ) : null}
              {plan === "holofote" ? (
                <Button small variant="ghost" onPress={() => router.push({ pathname: "/painel/estatisticas/[id]", params: { id: e.id } })}>
                  <Row style={{ gap: 6 }}>
                    <Icon icon={ChartColumn} size={14} />
                    <T size={13} weight="semibold">Estatísticas</T>
                  </Row>
                </Button>
              ) : null}
            </Row>
          </Card>
        );
      })}

      <DesktopCard admin={profile!.role === "admin"} socio={profile!.role === "admin"} />
      <View style={{ height: TOUCH }} />
    </Screen>
  );
}
