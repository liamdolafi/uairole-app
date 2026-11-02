import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import type { FriendLite } from "@/lib/friends";
import type { GoingState } from "@/lib/going";
import { C, R } from "@/lib/theme";
import type { EventWithVenue } from "@/lib/types";
import { Avatar } from "../avatar";
import { T } from "../ui";

export function goingText(n: number) {
  if (!n) return "Seja o primeiro a ir";
  return n === 1 ? "1 vai" : `${n} vão`;
}

/** Botão "Eu vou". Some quando o evento já acabou. */
export function GoingButton({ eventId, endsAt, going, size = "sm" }: { eventId: string; endsAt: string; going: GoingState; size?: "sm" | "lg" }) {
  const [err, setErr] = useState("");
  const [now] = useState(() => Date.now());
  const ended = new Date(endsAt).getTime() <= now;
  const on = going.mine.has(eventId);
  const n = going.counts[eventId] ?? 0;

  if (ended) return n ? <T size={12} color={C.muted}>{n} {n === 1 ? "foi" : "foram"}</T> : null;

  async function press() {
    setErr("");
    const r = await going.toggle(eventId);
    if ("needLogin" in r) return router.push("/entrar");
    if ("error" in r && r.error) return setErr("Não deu, tenta de novo.");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  const big = size === "lg";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: big ? 1 : undefined }}>
      <Pressable
        onPress={press}
        accessibilityState={{ selected: on }}
        style={({ pressed }) => ({
          height: big ? 46 : 32,
          paddingHorizontal: big ? 0 : 12,
          flex: big ? 1 : undefined,
          borderRadius: R.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: on ? `${C.ok}33` : big ? C.accent : C.surface2,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <T size={big ? 15 : 12} weight="semibold" color={on ? C.ok : big ? C.white : C.ink}>
          {on ? "✓ Eu vou!" : "🙋 Eu vou"}
        </T>
      </Pressable>
      <T size={big ? 14 : 12} color={C.muted}>{err || goingText(n)}</T>
    </View>
  );
}

/** "3 amigos vão" com as fotinhas */
export function FriendsGoing({ friends, size = 22 }: { friends?: FriendLite[]; size?: number }) {
  if (!friends?.length) return null;
  const n = friends.length;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ flexDirection: "row" }}>
        {friends.slice(0, 3).map((f, i) => (
          <View key={f.user_id} style={{ marginLeft: i ? -8 : 0 }}>
            <Avatar name={f.name} url={f.avatar_url} size={size} />
          </View>
        ))}
      </View>
      <T size={12} color={C.muted}>{n === 1 ? `${friends[0].name.split(" ")[0]} vai` : `${n} amigos vão`}</T>
    </View>
  );
}

/** Rodapé do card: "Eu vou" + amigos que vão */
export function CardFooter({ e, going, friends }: { e: EventWithVenue; going: GoingState; friends?: FriendLite[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <GoingButton eventId={e.id} endsAt={e.ends_at} going={going} />
      <FriendsGoing friends={friends} />
    </View>
  );
}
