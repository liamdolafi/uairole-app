// "Adicionar ao calendário": arquivo .ics (iPhone, Outlook, Android) e link do Google Agenda
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

export type CalEvent = { id: string; title: string; starts_at: string; ends_at: string; place: string; url: string; description?: string | null };

export function icsFor(e: CalEvent) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Uai Role//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@uairole`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.starts_at)}`,
    `DTEND:${stamp(e.ends_at)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.place)}`,
    `DESCRIPTION:${esc(`${(e.description ?? "").slice(0, 500)}\n\n${e.url}`.trim())}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(e: CalEvent) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.starts_at)}/${stamp(e.ends_at)}`,
    location: e.place,
    details: e.url,
    ctz: "America/Sao_Paulo",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
