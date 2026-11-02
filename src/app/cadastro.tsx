import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { DateInput } from "@/components/auth-inputs";
import { Button, ErrorBox, Input, LinkText, PageTitle, Screen, T } from "@/components/ui";
import { ageFromBirth, brDateToIso, errMsg } from "@/lib/format";
import { openSite } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { closeAuth } from "@/lib/links";

export default function Cadastro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birth, setBirth] = useState("");
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (name.trim().length < 2) return setError("Coloca seu nome, uai.");
    if (!email.includes("@")) return setError("Confere seu e-mail.");
    const iso = brDateToIso(birth);
    if (!iso) return setError("Coloca sua data de nascimento (DD/MM/AAAA).");
    const age = ageFromBirth(iso);
    if (age < 13) return setError("O Uai Rolê é pra quem tem 13 anos ou mais.");
    if (age > 110) return setError("Confere a data de nascimento.");
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (!accept) return setError("Você precisa aceitar os Termos e a Política de Privacidade.");
    setLoading(true);
    const mail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password,
      options: { data: { name: name.trim(), birth_date: iso } },
    });
    setLoading(false);
    if (error) {
      const m = errMsg(error);
      return setError(/Database error/i.test(m) ? "Não deu pra criar a conta. Confere a data de nascimento." : m);
    }
    if (data.session) return closeAuth();
    router.push({ pathname: "/verificar", params: { tipo: "cadastro", email: mail } });
  }

  return (
    <Screen padTop={false}>
      <PageTitle sub="Bora descobrir os melhores rolês de BH.">Criar conta</PageTitle>
      {error ? <ErrorBox message={error} /> : null}
      <Input label="Nome" value={name} onChangeText={setName} maxLength={80} autoComplete="name" textContentType="name" />
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry hint="Mínimo de 6 caracteres." autoComplete="new-password" textContentType="newPassword" />
      <DateInput label="Data de nascimento" value={birth} onChange={setBirth} hint="Usamos pra mostrar só eventos da sua idade. Não dá pra mudar depois." />
      <Pressable onPress={() => setAccept(!accept)} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }} accessibilityRole="checkbox" accessibilityState={{ checked: accept }}>
        <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: accept ? C.accent : C.line, backgroundColor: accept ? C.accent : "transparent", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
          {accept ? <T size={13} weight="bold" color={C.white}>✓</T> : null}
        </View>
        <T size={14} color={C.muted} style={{ flex: 1 }}>
          Li e aceito os <LinkText onPress={() => openSite("/termos")} color={C.ink}>Termos de Uso</LinkText> e a{" "}
          <LinkText onPress={() => openSite("/privacidade")} color={C.ink}>Política de Privacidade</LinkText>.
        </T>
      </Pressable>
      <Button onPress={submit} loading={loading}>Criar conta</Button>
      <View style={{ alignItems: "center" }}>
        <T size={14} color={C.muted}>
          Já tem conta? <LinkText onPress={() => router.replace("/entrar")}>Entrar</LinkText>
        </T>
      </View>
    </Screen>
  );
}
