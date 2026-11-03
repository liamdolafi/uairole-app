import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { OtpInput } from "@/components/auth-inputs";
import { Button, ErrorBox, Input, LinkText, Notice, PageTitle, Screen, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { closeAuth } from "@/lib/links";

const WAIT = 60;

function codeError(e: { message: string; code?: string }) {
  if (e.code === "otp_expired" || /expired|invalid/i.test(e.message)) return "Código errado ou expirado. Confere os números ou toca em “Reenviar código”.";
  return errMsg(e);
}

/** Tela "Digite o código" — cadastro (signup) ou esqueci a senha (recovery) */
export default function Verificar() {
  const params = useLocalSearchParams<{ tipo?: string; email?: string; enviado?: string }>();
  const kind = params.tipo === "senha" ? "senha" : "cadastro";
  const [email, setEmail] = useState(params.email ?? "");
  const [askEmail, setAskEmail] = useState(!params.email);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [wait, setWait] = useState(params.email && params.enviado !== "0" ? WAIT : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = useCallback(
    async (token: string) => {
      if (token.length !== 6) return setError("O código tem 6 números.");
      if (!email.trim()) return setError("Coloca seu e-mail.");
      setBusy(true);
      setError("");
      setInfo("");
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: kind === "cadastro" ? "signup" : "recovery" });
      setBusy(false);
      if (error) {
        setCode("");
        return setError(codeError(error));
      }
      if (kind === "cadastro") closeAuth();
      else router.replace("/nova-senha");
    },
    [email, kind],
  );

  async function resend() {
    const mail = email.trim().toLowerCase();
    if (!mail) return setError("Coloca seu e-mail.");
    setError("");
    setInfo("");
    const { error } = kind === "cadastro" ? await supabase.auth.resend({ type: "signup", email: mail }) : await supabase.auth.resetPasswordForEmail(mail);
    if (error) {
      const secs = error.message.match(/after (\d+) seconds?/)?.[1];
      if (secs) setWait(Number(secs));
      return setError(secs ? `Espera ${secs} segundos pra pedir outro código.` : errMsg(error));
    }
    setWait(WAIT);
    setAskEmail(false);
    setInfo("Código novo enviado! Olha seu e-mail (e o spam).");
  }

  return (
    <Screen padTop={false}>
      <PageTitle sub={kind === "cadastro" ? "Falta só confirmar seu e-mail." : "Pra trocar sua senha."}>Digite o código que enviamos pro seu e-mail</PageTitle>
      {askEmail ? (
        <Input label="Seu e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      ) : (
        <T size={14} color={C.muted}>
          Mandamos 6 números para <T size={14} weight="bold">{email}</T>. <LinkText onPress={() => setAskEmail(true)}>Trocar e-mail</LinkText>
        </T>
      )}
      {info ? <Notice>{info}</Notice> : null}
      {error ? <ErrorBox message={error} /> : null}
      <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={busy} />
      <Button onPress={() => verify(code)} loading={busy} disabled={code.length !== 6}>
        {kind === "cadastro" ? "Confirmar e entrar" : "Continuar"}
      </Button>
      <View style={{ alignItems: "center", gap: 12 }}>
        {wait > 0 ? <T size={14} color={C.muted}>Reenviar código em {wait}s</T> : <LinkText onPress={resend}>Reenviar código</LinkText>}
        <T size={12} color={C.muted} center>
          Não chegou? Olha o spam ou lixo eletrônico. O código vale por 1 hora.
        </T>
        <LinkText color={C.muted} size={13} onPress={() => router.replace("/entrar")}>Voltar pro login</LinkText>
      </View>
    </Screen>
  );
}
