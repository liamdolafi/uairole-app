import { router } from "expo-router";
import { Lightbulb, TriangleAlert } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { DateTimeField } from "@/components/date-time-field";
import { CATEGORY_ICON, Icon } from "@/components/icons";
import { Button, Card, Chip, ErrorBox, Input, LinkText, Loading, LoginNeeded, Notice, Row, Screen, T, Toggle } from "@/components/ui";
import { ageFromBirth, errMsg, formatDateLong } from "@/lib/format";
import { parseReais } from "@/lib/price-input";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import {
  AGE_LABEL,
  CATEGORIES,
  REQUEST_STATUS_LABEL,
  SUGGESTIONS_PER_DAY,
  type AgeRating,
  type Category,
  type EventSuggestion,
  type SuggestionDuplicate,
} from "@/lib/types";

const empty = { title: "", when: null as Date | null, place: "", neighborhood: "", category: "festa" as Category, free: true, price: "", age: "livre" as AgeRating, link: "" };

/** Começo do dia de hoje em BH */
function todayStartBH() {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return new Date(`${ymd}T00:00:00-03:00`);
}

/** "Sugerir um evento" (033): vai pra fila do Admin; aprovado, vira evento e a pessoa recebe um aviso */
export default function Sugerir() {
  const { user, profile, loading } = useAuth();
  const [f, setF] = useState(empty);
  const [mine, setMine] = useState<EventSuggestion[] | null>(null);
  const [dups, setDups] = useState<SuggestionDuplicate[]>([]);
  const [dupOk, setDupOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const loadMine = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("event_suggestions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setMine(error ? [] : ((data ?? []) as EventSuggestion[]));
  }, [user]);
  useEffect(() => {
    loadMine();
  }, [loadMine]);

  // já existe? (mesmo local e data)
  const whenIso = f.when?.toISOString() ?? null;
  useEffect(() => {
    setDupOk(false);
    if (!user || f.place.trim().length < 3 || !whenIso) return setDups([]);
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("suggestion_duplicates", { p_place: f.place.trim(), p_starts: whenIso, p_neighborhood: f.neighborhood.trim() || null });
      setDups(error ? [] : ((data ?? []) as SuggestionDuplicate[]));
    }, 600);
    return () => clearTimeout(t);
  }, [user, f.place, whenIso, f.neighborhood]);

  if (loading) return <Screen padTop={false}><Loading /></Screen>;
  if (!user || !profile) return <Screen padTop={false}><LoginNeeded text="Entra na sua conta pra sugerir um evento." /></Screen>;

  const age = profile.birth_date ? ageFromBirth(profile.birth_date) : null;
  const ages = (["livre", "16", "18"] as AgeRating[]).filter((r) => r === "livre" || (age !== null && age >= Number(r)));
  const usedToday = (mine ?? []).filter((x) => new Date(x.created_at) >= todayStartBH()).length;
  const left = Math.max(0, SUGGESTIONS_PER_DAY - usedToday);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((o) => ({ ...o, [k]: v }));

  async function send() {
    setError("");
    if (f.title.trim().length < 3) return setError("Coloca o nome do evento.");
    if (!f.when) return setError("Escolhe a data e o horário.");
    if (f.place.trim().length < 2) return setError("Coloca o local ou o endereço.");
    if (f.neighborhood.trim().length < 2) return setError("Coloca o bairro.");
    const price = f.free ? null : parseReais(f.price);
    if (!f.free && (price === null || Number.isNaN(price) || price <= 0)) return setError("Coloca o preço (ex.: 25 ou 25,50) ou marca Grátis.");
    if (f.link.trim() && !/^https?:\/\//i.test(f.link.trim())) return setError("O link precisa começar com https://");
    if (dups.length && !dupOk) return setError("Parece que esse rolê já existe. Confere a lista ou marca “É outro evento”.");
    setBusy(true);
    const { error } = await supabase.from("event_suggestions").insert({
      user_id: user!.id,
      title: f.title.trim(),
      starts_at: f.when.toISOString(),
      place: f.place.trim(),
      neighborhood: f.neighborhood.trim(),
      category: f.category,
      is_free: f.free,
      price_cents: f.free ? null : price,
      age_rating: f.age,
      source_url: f.link.trim() || null,
    });
    setBusy(false);
    if (error) return setError(/event_suggestions|schema cache/i.test(error.message) ? "Ainda não dá pra sugerir: falta atualizar o banco (033)." : errMsg(error));
    setSent(f.title.trim());
    setF(empty);
    setDups([]);
    loadMine();
  }

  return (
    <Screen padTop={false} onRefresh={loadMine}>
      <T size={14} color={C.muted}>Viu um rolê bom que ainda não está aqui? Manda pra gente. Se aprovar, ele entra no Uai Rolê e você recebe um aviso.</T>
      {sent ? (
        <Notice>{`Valeu! “${sent}” foi pra fila. Se for aprovado, você recebe um aviso.`}</Notice>
      ) : null}
      {error ? <ErrorBox message={error} /> : null}

      {left === 0 ? (
        <Card>
          <T color={C.warn}>Você já mandou {SUGGESTIONS_PER_DAY} sugestões hoje. Amanhã tem mais, sô!</T>
        </Card>
      ) : (
        <Card style={{ gap: 14 }}>
          <Input label="Nome do evento" maxLength={100} value={f.title} onChangeText={(t) => set("title", t)} />
          <DateTimeField label="Data e horário" value={f.when} onChange={(d) => set("when", d)} />
          <Input label="Local ou endereço" placeholder="Ex.: Mercado Novo ou Av. Olegário Maciel, 742" maxLength={200} value={f.place} onChangeText={(t) => set("place", t)} />
          <Input label="Bairro" maxLength={60} value={f.neighborhood} onChangeText={(t) => set("neighborhood", t)} />

          {dups.length ? (
            <View accessibilityRole="alert" style={{ gap: 8, padding: 12, borderRadius: R.md, borderWidth: 1, borderColor: `${C.warn}66`, backgroundColor: `${C.warn}14` }}>
              <Row style={{ alignItems: "flex-start" }}>
                <Icon icon={TriangleAlert} size={16} color={C.warn} />
                <T size={13} weight="semibold" color={C.warn} style={{ flex: 1 }}>Parece que esse rolê já existe (mesmo local e data):</T>
              </Row>
              {dups.map((d) =>
                d.kind === "evento" ? (
                  <LinkText key={d.kind + d.id} size={13} onPress={() => router.push({ pathname: "/evento/[id]", params: { id: d.id } })}>
                    {d.title} · {d.place}
                  </LinkText>
                ) : (
                  <T key={d.kind + d.id} size={13}>{d.title} · {d.place} (já sugerido, em análise)</T>
                ),
              )}
              <Toggle on={dupOk} onChange={setDupOk} label="É outro evento, mandar mesmo assim" />
            </View>
          ) : null}

          <View style={{ gap: 6 }}>
            <T size={13} weight="semibold">Categoria</T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <Chip key={c.id} icon={CATEGORY_ICON[c.id]} active={f.category === c.id} onPress={() => set("category", c.id)}>
                  {c.label}
                </Chip>
              ))}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <T size={13} weight="semibold">Preço</T>
            <Row>
              <Button small style={{ flex: 1 }} variant={f.free ? "primary" : "ghost"} onPress={() => set("free", true)} accessibilityState={{ selected: f.free }}>Grátis</Button>
              <Button small style={{ flex: 1 }} variant={!f.free ? "primary" : "ghost"} onPress={() => set("free", false)} accessibilityState={{ selected: !f.free }}>Pago</Button>
            </Row>
            {!f.free ? <Input placeholder="Preço em R$ (ex.: 25)" keyboardType="decimal-pad" value={f.price} onChangeText={(t) => set("price", t)} /> : null}
          </View>

          <View style={{ gap: 6 }}>
            <T size={13} weight="semibold">Classificação</T>
            <Row>
              {ages.map((r) => (
                <Button key={r} small style={{ flex: 1 }} variant={f.age === r ? "primary" : "ghost"} onPress={() => set("age", r)} accessibilityState={{ selected: f.age === r }}>
                  {AGE_LABEL[r]}
                </Button>
              ))}
            </Row>
          </View>

          <Input label="Onde você viu? (link do Instagram, site...)" placeholder="https://" autoCapitalize="none" keyboardType="url" maxLength={500} value={f.link} onChangeText={(t) => set("link", t)} />
          <T size={12} color={C.muted}>Você ainda pode mandar {left} {left === 1 ? "sugestão" : "sugestões"} hoje.</T>
          <Button onPress={send} loading={busy}>
            <Icon icon={Lightbulb} size={16} color={C.white} />
            <T weight="semibold" color={C.white}>Mandar sugestão</T>
          </Button>
        </Card>
      )}

      {mine && mine.length ? (
        <View style={{ gap: 8 }}>
          <T weight="semibold" accessibilityRole="header">Minhas sugestões</T>
          <Card style={{ gap: 12 }}>
            {mine.map((x) => (
              <Pressable
                key={x.id}
                disabled={!(x.status === "aprovada" && x.event_id)}
                onPress={() => x.event_id && router.push({ pathname: "/evento/[id]", params: { id: x.event_id } })}
                style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <T weight="semibold">{x.title}</T>
                  <T size={12} color={C.muted}>{x.place} · {formatDateLong(x.starts_at)}</T>
                  {x.status === "recusada" && x.admin_note ? <T size={12} color={C.muted}>Motivo: {x.admin_note}</T> : null}
                </View>
                <T size={12} weight="semibold" color={x.status === "aprovada" ? C.ok : x.status === "recusada" ? C.muted : C.warn}>
                  {REQUEST_STATUS_LABEL[x.status]}
                </T>
              </Pressable>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
