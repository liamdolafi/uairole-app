import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, ErrorBox, Input, LinkText, PageTitle, Screen, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { closeAuth } from "@/lib/links";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";

export default function Entrar() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!email.trim() || !password) return setError("Coloca seu e-mail e sua senha.");
    setLoading(true);
    const mail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
    if (error) {
      // conta sem confirmar: manda um código novo e leva pra tela do código
      if (/Email not confirmed/i.test(error.message)) {
        const r = await supabase.auth.resend({ type: "signup", email: mail });
        setLoading(false);
        return router.push({ pathname: "/verificar", params: { tipo: "cadastro", email: mail, enviado: r.error ? "0" : "1" } });
      }
      setLoading(false);
      return setError(errMsg(error));
    }
    setLoading(false);
    closeAuth();
  }

  return (
    <Screen padTop={false}>
      <PageTitle sub="Bora ver o que tá rolando em BH.">Entrar</PageTitle>
      {error ? <ErrorBox message={error} /> : null}
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
      <Button onPress={submit} loading={loading}>Entrar</Button>
      <View style={{ alignItems: "center", gap: 14 }}>
        <LinkText onPress={() => router.push("/recuperar-senha")} color={C.muted}>Esqueci a senha</LinkText>
        <T size={14} color={C.muted}>
          Ainda não tem conta? <LinkText onPress={() => router.replace("/cadastro")}>Criar conta</LinkText>
        </T>
      </View>
    </Screen>
  );
}
