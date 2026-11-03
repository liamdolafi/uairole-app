import { useEffect, useState } from "react";
import { View } from "react-native";
import { errMsg, formatPrice } from "@/lib/format";
import { fetchMenu, type MenuCategory } from "@/lib/menu";
import { C } from "@/lib/theme";
import { useAuth } from "./auth-provider";
import { ErrorBox, Spinner, T } from "./ui";

/** Tabela de preços do local (o banco já esconde bebida alcoólica de quem não tem 18+) */
export function MenuView({ venueId }: { venueId: string }) {
  const { user } = useAuth();
  const [menu, setMenu] = useState<MenuCategory[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMenu(null);
    fetchMenu(venueId)
      .then(setMenu)
      .catch((e) => setError(errMsg(e)));
  }, [venueId, user?.id]);

  if (error) return <ErrorBox message={error} />;
  if (!menu) return <Spinner small />;
  const cats = menu.filter((c) => c.items.length);
  if (!cats.length) return <T size={14} color={C.muted}>Esse local ainda não colocou a tabela de preços.</T>;

  return (
    <View style={{ gap: 16 }}>
      {cats.map((c) => (
        <View key={c.id} style={{ gap: 8 }}>
          <T size={13} weight="bold" color={C.accent}>{c.name.toUpperCase()}</T>
          {c.items.map((i) => (
            <View key={i.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <T size={14} weight="semibold">
                  {i.name}
                  {i.alcoholic ? <T size={11} weight="bold" color={C.danger}>  18+</T> : null}
                </T>
                {i.description ? <T size={12} color={C.muted}>{i.description}</T> : null}
              </View>
              <T size={14} weight="semibold">{formatPrice(i.price_cents)}</T>
            </View>
          ))}
        </View>
      ))}
      {!user ? <T size={12} color={C.muted}>Alguns itens só aparecem pra quem entra na conta (e tem idade pra isso).</T> : null}
    </View>
  );
}
