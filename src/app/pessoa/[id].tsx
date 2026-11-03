import { MessageCircleOff } from "lucide-react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { Button, Empty, ErrorBox, Loading, Notice, Row, Screen, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { acceptFriend, removeFriendshipWith, sendFriendRequest } from "@/lib/friends";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";

type Person = { id: string; name: string; avatar_url: string | null; role: string; relation: "amigo" | "enviado" | "recebido" | null; can_add: boolean; i_blocked: boolean };

/** Perfil de outra pessoa: adicionar, aceitar, desfazer e bloquear (regras do banco) */
export default function PessoaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [person, setPerson] = useState<Person | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("person_profile", { p_id: id });
    if (error) return /invalid input syntax/i.test(error.message) ? setPerson(null) : setError(errMsg(error));
    setPerson(((data ?? []) as Person[])[0] ?? null);
  }, [id]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, user?.id, load]);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError("");
    const { error } = await fn();
    setBusy(false);
    if (error) return setError(errMsg(error));
    load();
  }

  if (error && !person) return <Screen padTop={false}><ErrorBox message={error} onRetry={load} /></Screen>;
  if (person === undefined) return <Screen padTop={false}><Loading /></Screen>;
  if (person === null)
    return (
      <Screen padTop={false}>
        <Empty icon={MessageCircleOff} title="Perfil não encontrado">Essa pessoa não existe ou não está disponível pra você.</Empty>
      </Screen>
    );

  const isMe = user?.id === person.id;
  const isOrg = person.role === "organizador" || person.role === "admin";

  async function accept() {
    const { data } = await supabase.rpc("my_friends");
    const f = ((data ?? []) as { friendship_id: string; id: string }[]).find((x) => x.id === person!.id);
    if (f) run(() => acceptFriend(f.friendship_id));
  }

  return (
    <Screen padTop={false} onRefresh={load}>
      <Stack.Screen options={{ title: person.name }} />
      <View style={{ alignItems: "center", gap: 10, paddingTop: 8 }}>
        <Avatar name={person.name} url={person.avatar_url} size={96} />
        <T size={24} weight="displayBlack" center>{person.name}</T>
        {person.relation === "amigo" ? (
          <View style={{ backgroundColor: `${C.ok}26`, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 3 }}>
            <T size={12} weight="semibold" color={C.ok}>Vocês são amigos</T>
          </View>
        ) : null}
      </View>
      {error ? <ErrorBox message={error} /> : null}

      {isOrg ? <Button variant="outline" onPress={() => router.push({ pathname: "/organizador/[id]", params: { id: person.id } })}>Ver rolês desse organizador</Button> : null}

      {!user ? (
        <Button onPress={() => router.push("/entrar")}>Entre pra adicionar</Button>
      ) : isMe ? (
        <Notice>Esse é você!</Notice>
      ) : person.i_blocked ? (
        <View style={{ gap: 10 }}>
          <Notice>Você bloqueou essa pessoa.</Notice>
          <Button variant="ghost" loading={busy} onPress={() => run(() => supabase.from("blocks").delete().eq("blocked_id", person.id).eq("blocker_id", user.id))}>
            Desbloquear
          </Button>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {person.relation === "amigo" ? (
            <Button
              variant="ghost"
              loading={busy}
              onPress={() =>
                Alert.alert("Desfazer amizade?", undefined, [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Desfazer", style: "destructive", onPress: () => run(() => removeFriendshipWith(user.id, person.id)) },
                ])
              }
            >
              Desfazer amizade
            </Button>
          ) : person.relation === "enviado" ? (
            <Button variant="ghost" loading={busy} onPress={() => run(() => removeFriendshipWith(user.id, person.id))}>Cancelar pedido</Button>
          ) : person.relation === "recebido" ? (
            <Row>
              <Button style={{ flex: 1 }} loading={busy} onPress={accept}>Aceitar pedido</Button>
              <Button variant="ghost" loading={busy} onPress={() => run(() => removeFriendshipWith(user.id, person.id))}>Recusar</Button>
            </Row>
          ) : person.can_add ? (
            <Button loading={busy} onPress={() => run(() => sendFriendRequest(person.id))}>+ Adicionar amigo</Button>
          ) : (
            <T size={13} color={C.muted} center>Por segurança, não dá pra adicionar essa pessoa (regra de idade).</T>
          )}
          <Button
            variant="outline"
            onPress={() =>
              Alert.alert(`Bloquear ${person.name}?`, "A pessoa não vai ver seu perfil nem nada seu, e a amizade é desfeita.", [
                { text: "Cancelar", style: "cancel" },
                { text: "Bloquear", style: "destructive", onPress: () => run(() => supabase.from("blocks").insert({ blocked_id: person.id })) },
              ])
            }
          >
            Bloquear
          </Button>
        </View>
      )}
    </Screen>
  );
}
