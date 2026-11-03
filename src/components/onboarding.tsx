import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Bell, LocateFixed, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enablePush, isExpoGo, notifications } from "@/lib/push";
import { supabase } from "@/lib/supabase";
import { C, F, R, TOUCH } from "@/lib/theme";
import { CATEGORIES, type Category } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { CATEGORY_ICON, CategoryArt, HolofoteIcon, Icon } from "./icons";
import { Button, Chip, T } from "./ui";

const DONE_KEY = "uairole:boas-vindas:v1";
const PREFS_KEY = "uairole:boas-vindas:prefs";

type Prefs = { cats: Category[]; hood: string; push: boolean; synced?: boolean };

const HOODS = ["Savassi", "Centro", "Funcionários", "Lourdes", "Santa Tereza", "Pampulha", "Floresta", "Sion", "Barro Preto", "Santo Agostinho", "Buritis", "Castelo"];

const SLIDES: { art: React.ReactNode; title: string; text: string }[] = [
  {
    art: <CategoryArt category="festa" size={170} bg />,
    title: "Bem-vindo ao Uai Rolê, sô!",
    text: "Festa, show, pelada, feira e boteco: todos os rolês de BH num lugar só.",
  },
  {
    art: <CategoryArt category="show" size={170} bg />,
    title: "Veja se tá bombando",
    text: "O termômetro mostra como tá a lotação, a música e a vibe, contado por quem tá lá agora.",
  },
  {
    art: <CategoryArt category="pelada" size={170} bg />,
    title: "Chama a galera",
    text: "Marca “Eu vou”, salva nos favoritos e vê quais amigos vão. Tudo com a sua privacidade no controle.",
  },
];

/** Salva interesses e bairro no perfil quando a pessoa entra na conta (uma vez) */
async function syncPrefs(userId: string) {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as Prefs;
    if (p.synced) return;
    if (p.cats.length) await supabase.from("category_interests").upsert(p.cats.map((category) => ({ user_id: userId, category })), { ignoreDuplicates: true });
    if (p.hood) {
      const { data } = await supabase.from("profiles").select("home_neighborhood").eq("id", userId).maybeSingle();
      if (!data?.home_neighborhood) await supabase.from("profiles").update({ home_neighborhood: p.hood }).eq("id", userId);
    }
    if (p.push) await enablePush();
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ ...p, synced: true }));
  } catch {
    // tenta de novo na próxima vez
  }
}

/** Boas-vindas na primeira vez que abre o app */
export function Onboarding() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<Category[]>([]);
  const [hood, setHood] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(DONE_KEY)
      .then((v) => setOpen(!v))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && user && !open) syncPrefs(user.id);
  }, [loading, user, open]);

  if (!open) return null;

  const last = SLIDES.length + 2; // interesses, localização, notificações
  const next = () => {
    setMsg("");
    setStep((s) => s + 1);
  };

  async function savePrefs(push: boolean) {
    const p: Prefs = { cats, hood: hood.trim(), push };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p)).catch(() => {});
  }

  async function finish(push: boolean) {
    await savePrefs(push);
    await AsyncStorage.setItem(DONE_KEY, new Date().toISOString()).catch(() => {});
    setOpen(false);
    if (user) syncPrefs(user.id);
  }

  async function askLocation() {
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // segue sem
    }
    next();
  }

  async function askPush() {
    if (user) {
      const r = await enablePush();
      if ("error" in r && !isExpoGo) setMsg(r.error);
      return finish(true);
    }
    // sem conta ainda: só pede a permissão; o celular é ligado quando a pessoa entrar
    try {
      const N = notifications();
      if (N && !isExpoGo) await N.requestPermissionsAsync();
    } catch {
      // segue sem
    }
    finish(true);
  }

  const dots = (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }} accessibilityLabel={`Passo ${step + 1} de ${last + 1}`}>
      {Array.from({ length: last + 1 }, (_, i) => (
        <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? C.accent : C.line }} />
      ))}
    </View>
  );

  return (
    <Modal visible animationType="fade" onRequestClose={() => finish(false)}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", minHeight: TOUCH }}>
          {step < last ? (
            <Pressable onPress={() => finish(false)} accessibilityRole="button" style={{ minHeight: TOUCH, justifyContent: "center", paddingHorizontal: 8 }}>
              <T weight="semibold" color={C.muted}>Pular</T>
            </Pressable>
          ) : null}
        </View>

        {step < SLIDES.length ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 22 }}>
            {SLIDES[step].art}
            <T size={28} weight="displayBlack" center style={{ lineHeight: 32 }} accessibilityRole="header">
              {SLIDES[step].title}
            </T>
            <T size={16} color={C.muted} center style={{ lineHeight: 23, maxWidth: 340 }}>
              {SLIDES[step].text}
            </T>
          </View>
        ) : step === SLIDES.length ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
            <T size={26} weight="displayBlack" style={{ lineHeight: 30 }} accessibilityRole="header">
              Do que você curte?
            </T>
            <T size={14} color={C.muted}>A gente usa isso pra te avisar de rolê com Holofote nas categorias que você escolher. Dá pra mudar depois.</T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => {
                const on = cats.includes(c.id);
                return (
                  <Chip key={c.id} icon={CATEGORY_ICON[c.id]} active={on} onPress={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])}>
                    {c.label}
                  </Chip>
                );
              })}
            </View>
            <T size={18} weight="display" style={{ marginTop: 10 }}>
              Seu bairro (opcional)
            </T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: TOUCH + 4, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 12 }}>
              <Icon icon={MapPin} size={18} color={C.muted} />
              <TextInput
                value={hood}
                onChangeText={setHood}
                placeholder="Ex.: Santa Tereza"
                placeholderTextColor={C.muted}
                selectionColor={C.accent}
                maxLength={60}
                accessibilityLabel="Seu bairro"
                style={{ flex: 1, color: C.ink, fontFamily: F.regular, fontSize: 15, height: "100%" }}
              />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {HOODS.map((h) => (
                <Chip key={h} active={hood === h} onPress={() => setHood(hood === h ? "" : h)}>
                  {h}
                </Chip>
              ))}
            </View>
            <T size={12} color={C.muted}>O bairro ajuda os organizadores a saber de onde vem o público, sempre agrupado e sem identificar ninguém.</T>
          </ScrollView>
        ) : step === SLIDES.length + 1 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" }}>
              <Icon icon={LocateFixed} size={52} color={C.accent} />
            </View>
            <T size={26} weight="displayBlack" center accessibilityRole="header">
              Rolê perto de você
            </T>
            <T size={15} color={C.muted} center style={{ lineHeight: 22, maxWidth: 340 }}>
              Sua localização é usada só na hora: pra mostrar o que tá perto, filtrar por distância e fazer check-in. A gente nunca guarda por onde você andou.
            </T>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" }}>
              <Icon icon={Bell} size={52} color={C.accent} />
            </View>
            <T size={26} weight="displayBlack" center accessibilityRole="header">
              Fica sabendo primeiro
            </T>
            <T size={15} color={C.muted} center style={{ lineHeight: 22, maxWidth: 340 }}>
              Avisamos quando um local que você segue ou uma categoria que você curte entra no Holofote, e quando chega pedido de amizade. Sem spam, sô.
            </T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <HolofoteIcon size={16} color={C.accent} />
              <T size={13} color={C.muted}>Respeita a sua idade, igual ao resto do app.</T>
            </View>
            {msg ? <T size={13} color={C.danger} center>{msg}</T> : null}
          </View>
        )}

        <View style={{ gap: 14 }}>
          {dots}
          {step < SLIDES.length ? (
            <Button onPress={next}>{step === SLIDES.length - 1 ? "Bora configurar" : "Próximo"}</Button>
          ) : step === SLIDES.length ? (
            <Button onPress={next}>{cats.length || hood ? "Continuar" : "Pular essa parte"}</Button>
          ) : step === SLIDES.length + 1 ? (
            <>
              <Button onPress={askLocation}>Permitir localização</Button>
              <Button variant="ghost" onPress={next}>Agora não</Button>
            </>
          ) : (
            <>
              <Button onPress={askPush}>Ativar notificações</Button>
              <Button variant="ghost" onPress={() => finish(false)}>Agora não</Button>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
