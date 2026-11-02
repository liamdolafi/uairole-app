import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ageFromBirth, brDateToIso, errMsg } from "@/lib/format";
import { disablePush } from "@/lib/push";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { useAuth } from "./auth-provider";
import { DateInput } from "./auth-inputs";
import { Button, ErrorBox, Input, LinkText, T } from "./ui";

/**
 * Conta sem data de nascimento: pede a data na primeira entrada (igual ao site).
 * Até preencher, o banco trata a pessoa como o caso mais restrito (só vê eventos Livre).
 */
export function BirthDateGate() {
  const { user, profile, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  const open = Boolean(user && profile && !profile.birth_date);
  if (!open) return null;

  async function save() {
    setError("");
    if (name.trim().length < 2) return setError("Coloca seu nome, uai.");
    const iso = brDateToIso(birth);
    if (!iso) return setError("Coloca sua data de nascimento (DD/MM/AAAA).");
    const age = ageFromBirth(iso);
    if (age < 13) return setError("O Uai Rolê é pra quem tem 13 anos ou mais.");
    if (age > 110) return setError("Confere a data de nascimento.");
    Alert.alert("Confirma a data?", `${birth}. Depois não dá pra mudar.`, [
      { text: "Corrigir", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.from("profiles").update({ name: name.trim().slice(0, 80), birth_date: iso }).eq("id", profile!.id);
          setBusy(false);
          if (error) return setError(errMsg(error));
          await refreshProfile();
        },
      },
    ]);
  }

  async function signOut() {
    await disablePush().catch(() => {});
    await supabase.auth.signOut();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => {}}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#000c" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: 20, paddingBottom: insets.bottom + 20, gap: 14, borderWidth: 1, borderColor: C.line }}>
          <View style={{ gap: 4 }}>
            <T size={22} weight="displayBlack">Falta só um tiquinho! 🎂</T>
            <T size={14} color={C.muted}>
              Precisamos da sua data de nascimento pra mostrar só os rolês da sua idade. Enquanto isso, você vê só eventos Livre.
            </T>
          </View>
          {error ? <ErrorBox message={error} /> : null}
          <Input label="Seu nome" maxLength={80} value={name} onChangeText={setName} />
          <DateInput label="Data de nascimento" value={birth} onChange={setBirth} hint="Não dá pra mudar depois." />
          <Button onPress={save} loading={busy}>Salvar e continuar</Button>
          <View style={{ alignItems: "center" }}>
            <LinkText color={C.muted} onPress={signOut}>Sair da conta</LinkText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
