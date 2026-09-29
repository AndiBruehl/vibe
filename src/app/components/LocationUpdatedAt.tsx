export default function LocationUpdatedAt({ value, de }: { value?: string | null; de: boolean }) {
  const date = value ? new Date(value) : null;
  return <p className="text-xs opacity-75">{de ? "Zuletzt aktualisiert: " : "Last updated: "}{date && Number.isFinite(date.getTime()) ? <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat(de ? "de-DE" : "en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(date)} UTC</time> : (de ? "Unbekannt" : "Unknown")} · {de ? "Kein Live-Standort" : "Not a live location"}</p>;
}
