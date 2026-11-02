import { useEffect } from "react";
import { openAppUrl } from "@/lib/links";
import { notifications, refreshPushToken } from "@/lib/push";
import { useAuth } from "./auth-provider";

/** Quando a pessoa toca numa notificação, abre a tela certa. */
export function PushListener() {
  const { user } = useAuth();

  useEffect(() => {
    const N = notifications();
    if (!N) return;
    const open = (data: unknown) => openAppUrl((data as { url?: string } | undefined)?.url);
    // app estava fechado e abriu pela notificação
    N.getLastNotificationResponseAsync()
      .then((r) => r && setTimeout(() => open(r.notification.request.content.data), 600))
      .catch(() => {});
    const sub = N.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (user) refreshPushToken().catch(() => {});
  }, [user]);

  return null;
}
