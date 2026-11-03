import { Alert } from "react-native";
import { api } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";

type Preview = { series_dates: number; tickets: number; paid: number; series_tickets: number; going: number };
type Result = { events: number; refunds_pending: number; event_ids: string[] };

async function run(eventId: string, scope: "esta" | "serie", onDone: () => void, onError: (m: string) => void) {
  const { data, error } = await supabase.rpc("cancel_event", { p_event: eventId, p_scope: scope });
  if (error) return onError(errMsg(error));
  const r = data as Result;
  let msg = r.events > 1 ? `${r.events} datas canceladas.` : "Evento cancelado.";
  if (r.refunds_pending) {
    const j = await api<{ refunded: number; pending: number; configured: boolean }>("/api/pagamentos/reembolsar", { body: { eventIds: r.event_ids } });
    if (!("error" in j) && j.configured && !j.pending) {
      msg += ` ${j.refunded} pagamento(s) reembolsado(s) pelo Mercado Pago.`;
    } else {
      for (const id of r.event_ids) await supabase.rpc("notify_refunds_pending", { p_event: id });
      msg += ` ${r.refunds_pending} pagamento(s) ficaram marcados pra reembolso e o admin foi avisado.`;
    }
  }
  Alert.alert("Pronto", `${msg} Quem tinha ingresso ou clicou “Eu vou” recebeu um aviso.`, [{ text: "OK", onPress: onDone }]);
}

/**
 * "Cancelar evento": explica o que acontece → (série) só esta data ou todas → cancela →
 * reembolsa pelo Mercado Pago (ou marca pra reembolso e avisa o admin).
 */
export async function cancelEventFlow(eventId: string, title: string, onDone: () => void, onError: (m: string) => void) {
  const { data, error } = await supabase.rpc("cancel_event_preview", { p_event: eventId });
  if (error) return onError(errMsg(error));
  const pv = data as Preview;
  const lines = [
    `“${title}”`,
    "",
    "• O evento sai da lista e do mapa na hora.",
    `• Quem tinha ingresso${pv.tickets ? ` (${pv.tickets})` : ""} ou clicou “Eu vou”${pv.going ? ` (${pv.going})` : ""} recebe um aviso e vê o evento como Cancelado.`,
    pv.paid || pv.series_tickets ? "• Os ingressos pagos são reembolsados pelo Mercado Pago (valor total)." : "",
    "• Não dá pra desfazer.",
  ].filter((l, i) => l || i === 1);
  const buttons =
    pv.series_dates > 1
      ? [
          { text: "Voltar", style: "cancel" as const },
          { text: "Só esta data", style: "destructive" as const, onPress: () => run(eventId, "esta", onDone, onError) },
          { text: `Todas as datas (${pv.series_dates})`, style: "destructive" as const, onPress: () => run(eventId, "serie", onDone, onError) },
        ]
      : [
          { text: "Voltar", style: "cancel" as const },
          { text: "Cancelar evento", style: "destructive" as const, onPress: () => run(eventId, "esta", onDone, onError) },
        ];
  Alert.alert(pv.series_dates > 1 ? "Cancelar evento que se repete?" : "Cancelar evento?", lines.join("\n"), buttons);
}
