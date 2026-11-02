import { router } from "expo-router";
import { useState } from "react";
import { Button, ErrorBox, Input, PageTitle, Screen } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    const mail = email.trim().toLowerCase();
    if (!mail.includes("@")) return setError("Coloca seu e-mail.");
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(mail);
    setLoading(false);
    if (error) return setError(errMsg(error));
    router.replace({ pathname: "/verificar", params: { tipo: "senha", email: mail } });
  }

  return (
    <Screen padTop={false}>
      <PageTitle sub="A gente te manda um código de 6 números pra criar uma senha nova.">Recuperar senha</PageTitle>
      {error ? <ErrorBox message={error} /> : null}
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" onSubmitEditing={submit} />
      <Button onPress={submit} loading={loading}>Enviar código</Button>
    </Screen>
  );
}
