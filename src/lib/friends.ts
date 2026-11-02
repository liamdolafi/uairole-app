import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

export type FriendLite = { user_id: string; name: string; avatar_url: string | null };

/** Amigos que vão em cada evento (só quem ligou o compartilhamento) */
export function useFriendsGoing(ids: string[]) {
  const { user } = useAuth();
  const [map, setMap] = useState<Record<string, FriendLite[]>>({});
  const key = useMemo(() => [...ids].sort().join(","), [ids]);

  useEffect(() => {
    if (!user || !key) return setMap({});
    let alive = true;
    supabase
      .rpc("friends_going", { p_events: key.split(",") })
      .then(({ data, error }) => {
        if (!alive || error) return;
        const m: Record<string, FriendLite[]> = {};
        for (const r of (data ?? []) as (FriendLite & { event_id: string })[]) (m[r.event_id] ??= []).push(r);
        setMap(m);
      });
    return () => {
      alive = false;
    };
  }, [key, user]);

  return map;
}

export async function sendFriendRequest(addresseeId: string) {
  return supabase.from("friendships").insert({ addressee_id: addresseeId });
}
export async function acceptFriend(friendshipId: string) {
  return supabase.from("friendships").update({ status: "aceita", accepted_at: new Date().toISOString() }).eq("id", friendshipId);
}
export async function removeFriendship(friendshipId: string) {
  return supabase.from("friendships").delete().eq("id", friendshipId);
}
/** Desfaz amizade/pedido com uma pessoa (sem saber o id da amizade) */
export async function removeFriendshipWith(me: string, other: string) {
  return supabase
    .from("friendships")
    .delete()
    .or(`and(requester_id.eq.${me},addressee_id.eq.${other}),and(requester_id.eq.${other},addressee_id.eq.${me})`);
}
