import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { LocateFixed, Search } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Icon } from "@/components/icons";
import { BH_REGION } from "@/components/map/pin";
import { Button, Empty, ErrorBox, Input, Loading, Notice, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import type { Venue } from "@/lib/types";

/** Criar/editar local: o endereço vira um ponto no mapa (e dá pra arrastar o pino) */
export default function LocalForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "novo";
  const nav = useNavigation();
  const { profile } = useAuth();
  const map = useRef<MapView>(null);
  const [venue, setVenue] = useState<Venue | null | undefined>(isNew ? null : undefined);
  const [f, setF] = useState({ name: "", address: "", neighborhood: "" });
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busy, setBusy] = useState<"" | "geo" | "save" | "archive">("");
  const [err, setErr] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    nav.setOptions({ title: isNew ? "Novo local" : "Editar local" });
    if (isNew) return;
    supabase
      .from("venues")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data as Venue) ?? null;
        setVenue(v);
        if (v) {
          setF({ name: v.name, address: v.address ?? "", neighborhood: v.neighborhood });
          setPoint({ latitude: v.lat, longitude: v.lng });
        }
      });
  }, [id, isNew, nav]);

  if (!profile) return <Screen padTop={false}><Loading /></Screen>;
  if (venue === undefined) return <Screen padTop={false}><Loading /></Screen>;
  if (!isNew && !venue) return <Screen padTop={false}><Empty title="Local não encontrado" /></Screen>;
  if (venue && profile.role !== "admin" && venue.owner_id !== profile.id) return <Screen padTop={false}><Empty title="Esse local não é seu" /></Screen>;

  async function geocode() {
    if (f.address.trim().length < 3) return setErr("Escreve o endereço (rua e número).");
    setErr("");
    setHint("");
    setBusy("geo");
    const r = await api<{ result: { lat: number; lng: number; label: string } | null }>(
      `/api/geocode?endereco=${encodeURIComponent(f.address.trim())}&bairro=${encodeURIComponent(f.neighborhood.trim())}`,
      { method: "GET" },
    );
    setBusy("");
    if ("error" in r) return setErr(r.error);
    if (!r.result) return setHint("Não achamos esse endereço. Toque no mapa ou arraste o pino até o lugar certo.");
    const p = { latitude: r.result.lat, longitude: r.result.lng };
    setPoint(p);
    map.current?.animateToRegion({ ...p, latitudeDelta: 0.006, longitudeDelta: 0.006 }, 400);
    setHint("Achamos! Confira o pino e arraste se precisar.");
  }

  async function save() {
    setErr("");
    if (f.name.trim().length < 2) return setErr("Nome do local muito curto.");
    if (f.neighborhood.trim().length < 2) return setErr("Coloca o bairro.");
    if (!point) return setErr("Marque o ponto no mapa (busque o endereço ou toque no mapa).");
    setBusy("save");
    const row = { name: f.name.trim(), address: f.address.trim() || null, neighborhood: f.neighborhood.trim(), lat: point.latitude, lng: point.longitude };
    const { error } = isNew ? await supabase.from("venues").insert(row) : await supabase.from("venues").update(row).eq("id", id);
    setBusy("");
    if (error) return setErr(errMsg(error));
    router.back();
  }

  function toggleArchive() {
    if (!venue) return;
    const archive = !venue.archived;
    Alert.alert(archive ? "Desativar local?" : "Reativar local?", archive ? "Ele some da lista na hora de criar eventos. Os eventos já publicados continuam." : undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: archive ? "Desativar" : "Reativar",
        onPress: async () => {
          setBusy("archive");
          const { error } = await supabase.from("venues").update({ archived: archive }).eq("id", venue.id);
          setBusy("");
          if (error) return setErr(errMsg(error));
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen padTop={false}>
      {err ? <ErrorBox message={err} /> : null}
      <Input label="Nome do local" maxLength={100} value={f.name} onChangeText={(name) => setF({ ...f, name })} placeholder="Ex.: Bar do Zé" />
      <Input label="Endereço" maxLength={200} value={f.address} onChangeText={(address) => setF({ ...f, address })} placeholder="Rua, número" />
      <Input label="Bairro" maxLength={60} value={f.neighborhood} onChangeText={(neighborhood) => setF({ ...f, neighborhood })} placeholder="Ex.: Santa Tereza" />
      <Button variant="ghost" loading={busy === "geo"} onPress={geocode}>
        <Row>
          <Icon icon={Search} size={18} />
          <T weight="semibold">Achar no mapa</T>
        </Row>
      </Button>
      {hint ? <Notice>{hint}</Notice> : null}
      <View style={{ height: 260, borderRadius: R.lg, overflow: "hidden", borderWidth: 1, borderColor: C.line }}>
        <MapView
          ref={map}
          style={{ flex: 1 }}
          initialRegion={point ? { ...point, latitudeDelta: 0.008, longitudeDelta: 0.008 } : BH_REGION}
          onPress={(e) => setPoint(e.nativeEvent.coordinate)}
          userInterfaceStyle="dark"
        >
          {point ? <Marker coordinate={point} draggable onDragEnd={(e) => setPoint(e.nativeEvent.coordinate)} pinColor={C.accent} /> : null}
        </MapView>
      </View>
      <Row>
        <Icon icon={LocateFixed} size={14} color={C.muted} />
        <T size={12} color={C.muted} style={{ flex: 1 }}>Toque no mapa ou arraste o pino até a porta do local.</T>
      </Row>
      <Button loading={busy === "save"} onPress={save}>{isNew ? "Cadastrar local" : "Salvar"}</Button>
      {venue ? <Button variant="outline" loading={busy === "archive"} onPress={toggleArchive}>{venue.archived ? "Reativar local" : "Desativar local"}</Button> : null}
    </Screen>
  );
}
