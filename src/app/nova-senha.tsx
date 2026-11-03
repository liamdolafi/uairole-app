import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Button, ErrorBox, Input, LoginNeeded, PageTitle, Screen } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";

/** Depois do código de "esqueci a senha", a pessoa já está logada e escolhe a senha nova */
export default function NovaSenha() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <Screen padTop={false}><LoginNeeded text="O código expirou. Pede outro em “Esqueci a senha”." /></Screen>;

  async function submit() {
    setError("");
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirm) return setError("As duas senhas estão diferentes.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(/different from the old/i.test(error.message) ? "A senha nova precisa ser diferente da antiga." : errMsg(error));
    Alert.alert("Pronto!", "Senha trocada com sucesso!");
    if (router.canDismiss()) router.dismissAll();
    router.replace("/perfil");
  }

  return (
    <Screen padTop={false}>
      <PageTitle sub="Escolhe uma senha que você vai lembrar, sô.">Senha nova</PageTitle>
      {error ? <ErrorBox message={error} /> : null}
      <Input label="Senha nova" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <Input label="Repete a senha" value={confirm} onChangeText={setConfirm} secureTextEntry onSubmitEditing={submit} />
      <Button onPress={submit} loading={loading}>Salvar senha</Button>
    </Screen>
  );
}
