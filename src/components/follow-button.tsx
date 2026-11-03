import { Icon } from "@/components/icons";
import { Check, Plus } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useFollow, type FollowTarget } from "@/lib/follow";
import { C } from "@/lib/theme";
import { Button, T } from "./ui";

export function FollowButton({ target }: { target: FollowTarget }) {
  const { following, count, busy, toggle, isSelf } = useFollow(target);
  const [err, setErr] = useState("");
  if (isSelf) return null;

  async function press() {
    setErr("");
    const r = await toggle();
    if ("needLogin" in r) return router.push("/entrar");
    if ("error" in r && r.error) setErr("Não deu, tenta de novo.");
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Button variant={following ? "ok" : "primary"} onPress={press} loading={busy} style={{ minWidth: 130 }}>
        <Icon icon={following ? Check : Plus} size={18} color={following ? C.ok : C.white} />
        <T weight="semibold" color={following ? C.ok : C.white}>{following ? "Seguindo" : "Seguir"}</T>
      </Button>
      <T size={13} color={err ? C.danger : C.muted}>
        {err || (count === null ? "" : `${count} seguidor${count === 1 ? "" : "es"}`)}
      </T>
    </View>
  );
}
