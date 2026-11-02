import { supabase } from "@/lib/supabase";

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  alcoholic: boolean;
  position: number;
};
export type MenuCategory = { id: string; venue_id: string; name: string; position: number; items: MenuItem[] };

/** Carrega a tabela de preços (o banco já esconde bebida alcoólica de quem não pode ver) */
export async function fetchMenu(venueId: string): Promise<MenuCategory[]> {
  const sb = supabase;
  const [c, i] = await Promise.all([
    sb.from("menu_categories").select("id,venue_id,name,position").eq("venue_id", venueId).order("position").order("created_at"),
    sb.from("menu_items").select("id,category_id,name,description,price_cents,alcoholic,position").eq("venue_id", venueId).order("position").order("created_at"),
  ]);
  if (c.error) throw c.error;
  const items = (i.data ?? []) as MenuItem[];
  return ((c.data ?? []) as Omit<MenuCategory, "items">[]).map((cat) => ({
    ...cat,
    items: items.filter((it) => it.category_id === cat.id),
  }));
}
