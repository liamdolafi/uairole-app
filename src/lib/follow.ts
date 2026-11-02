import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

export type FollowTarget = { venueId: string } | { organizerId: string };

export function useFollow(target: FollowTarget) {
  const { user } = useAuth();
  const venueId = "venueId" in target ? target.venueId : null;
  const organizerId = "organizerId" in target ? target.organizerId : null;
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = supabase;
    sb.rpc("follower_count", { p_venue: venueId, p_organizer: organizerId }).then(({ data }) =>
      setCount(typeof data === "number" ? data : 0),
    );
    if (!user) return setFollowing(false);
    let q = sb.from("follows").select("id");
    q = venueId ? q.eq("venue_id", venueId) : q.eq("organizer_id", organizerId!);
    q.maybeSingle().then(({ data }) => setFollowing(Boolean(data)));
  }, [user, venueId, organizerId]);

  const toggle = useCallback(async () => {
    if (!user) return { needLogin: true as const };
    setBusy(true);
    const sb = supabase;
    let error;
    if (following) {
      let q = sb.from("follows").delete().eq("user_id", user.id);
      q = venueId ? q.eq("venue_id", venueId) : q.eq("organizer_id", organizerId!);
      ({ error } = await q);
    } else {
      ({ error } = await sb.from("follows").insert(venueId ? { venue_id: venueId } : { organizer_id: organizerId }));
    }
    setBusy(false);
    if (error) return { error: error.message };
    setFollowing(!following);
    setCount((c) => Math.max(0, (c ?? 0) + (following ? -1 : 1)));
    return { ok: true as const };
  }, [user, following, venueId, organizerId]);

  return { following, count, busy, toggle, isSelf: Boolean(user && organizerId === user.id) };
}
