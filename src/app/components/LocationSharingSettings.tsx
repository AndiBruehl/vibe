"use client";

import { LocateFixed, Map, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OpenStreetMap from "./OpenStreetMap";
import LocationUpdatedAt from "./LocationUpdatedAt";

type Candidate = { latitude: number; longitude: number; label: string };
type Props = { initialEnabled: boolean; initialPrecision: string; initialLatitude?: number | null; initialLongitude?: number | null; initialAddress?: string | null; initialUpdatedAt?: string | null; profileId: string; language: "en" | "de" };
type Status = "idle" | "working" | "searching" | "saved" | "error" | "notFound" | "lookupUnavailable" | "gpsError";
type Draft = { latitude: string; longitude: string; address: string; precision: string };

export default function LocationSharingSettings({ initialEnabled, initialPrecision, initialLatitude, initialLongitude, initialAddress, initialUpdatedAt, profileId, language }: Props) {
  const router = useRouter();
  const de = language === "de";
  const text = (en: string, german: string) => de ? german : en;
  const [manual, setManual] = useState(false);
  const [latitude, setLatitude] = useState(initialLatitude == null ? "" : String(initialLatitude));
  const [longitude, setLongitude] = useState(initialLongitude == null ? "" : String(initialLongitude));
  const [address, setAddress] = useState(initialAddress ?? "");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [precision, setPrecision] = useState(initialPrecision === "exact" ? "exact" : "approximate");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt ?? null);
  const [status, setStatus] = useState<Status>("idle");
  const [dirty, setDirty] = useState(false);
  const [restored, setRestored] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const revision = useRef(0);
  const mounted = useRef(true);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const draftKey = `vibe.locationDraft.${profileId}`;
  const lat = Number(latitude.replace(",", "."));
  const lng = Number(longitude.replace(",", "."));
  const valid = latitude.trim() !== "" && longitude.trim() !== "" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const points = useMemo(() => valid ? [{ latitude: lat, longitude: lng, label: address || (de ? "Gewählter Standort" : "Selected location") }] : [], [valid, lat, lng, address, de]);
  const edit = () => { revision.current += 1; setDirty(true); setStatus("idle"); setCandidates([]); setRestored(false); };

  useEffect(() => {
    mounted.current = true;
    const initialRevision = revision.current;
    const timer = window.setTimeout(() => {
      if (revision.current !== initialRevision) return;
      try {
        const stored = sessionStorage.getItem(draftKey);
        if (!stored) return;
        const draft = JSON.parse(stored) as Draft;
        if (![draft.latitude, draft.longitude, draft.address].every((v) => typeof v === "string")) return;
        revision.current += 1;
        setLatitude(draft.latitude); setLongitude(draft.longitude); setAddress(draft.address);
        setPrecision(draft.precision === "exact" ? "exact" : "approximate");
        setManual(true); setRestored(true);
        // A restored draft is shown for review, never silently published.
      } catch { /* Storage may be unavailable; the editor still works. */ }
    }, 0);
    return () => { clearTimeout(timer); mounted.current = false; revision.current += 1; };
  }, [draftKey]);

  useEffect(() => {
    if (!dirty) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ latitude, longitude, address, precision })); } catch { /* Optional recovery only. */ }
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, latitude, longitude, address, precision, draftKey]);

  const save = useCallback(async (payload: Record<string, unknown>) => {
    const requestRevision = revision.current;
    const previous = queue.current;
    let release!: () => void;
    queue.current = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    if (!mounted.current || requestRevision !== revision.current) { release(); return; }
    setStatus("working");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response: Response;
      let result;
      try {
        response = await fetch("/api/profile/location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal });
        result = await response.json();
      }
      finally { clearTimeout(timeout); }
      if (!mounted.current || requestRevision !== revision.current) return;
      if (!response.ok || result?.ok !== true) throw Error("save failed");
      if (payload.enabled === true && (typeof result.latitude !== "number" || !Number.isFinite(result.latitude) || Math.abs(result.latitude) > 90 || typeof result.longitude !== "number" || !Number.isFinite(result.longitude) || Math.abs(result.longitude) > 180)) throw Error("invalid saved location");
      setEnabled(payload.enabled === true);
      setLatitude(typeof result.latitude === "number" ? String(result.latitude) : "");
      setLongitude(typeof result.longitude === "number" ? String(result.longitude) : "");
      setAddress(typeof result.resolvedAddress === "string" ? result.resolvedAddress : "");
      setUpdatedAt(result.updatedAt ?? null);
      setDirty(false); setRestored(false); setStatus("saved");
      try { sessionStorage.removeItem(draftKey); } catch { /* Optional recovery only. */ }
      router.refresh();
    } catch { if (mounted.current && requestRevision === revision.current) setStatus("error"); }
    finally { release(); }
  }, [router, draftKey]);

  const saveCurrent = useCallback(() => {
    if (valid) return save({ enabled: true, latitude: lat, longitude: lng, address, precision });
  }, [valid, save, lat, lng, address, precision]);
  useEffect(() => {
    if (!dirty || !valid) return;
    const timer = setTimeout(() => { void saveCurrent(); }, 1800);
    return () => clearTimeout(timer);
  }, [dirty, valid, saveCurrent]);

  const search = async () => {
    if (!address.trim()) return;
    const requestRevision = ++revision.current;
    setStatus("searching"); setCandidates([]);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let response: Response;
      let result;
      try {
        response = await fetch("/api/profile/location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", address: address.trim(), language }), signal: controller.signal });
        result = await response.json();
      }
      finally { clearTimeout(timeout); }
      if (!mounted.current || requestRevision !== revision.current) return;
      if (result?.error === "AddressNotFound") { setStatus("notFound"); return; }
      if (!response.ok || !Array.isArray(result?.candidates)) throw Error("lookup failed");
      const choices = result.candidates.filter((item: Candidate | null) => item && typeof item.label === "string" && typeof item.latitude === "number" && Number.isFinite(item.latitude) && Math.abs(item.latitude) <= 90 && typeof item.longitude === "number" && Number.isFinite(item.longitude) && Math.abs(item.longitude) <= 180).slice(0, 5);
      if (!choices.length) throw Error("invalid lookup response");
      setCandidates(choices); setStatus("idle");
    } catch { if (mounted.current && requestRevision === revision.current) setStatus("lookupUnavailable"); }
  };
  const choose = (candidate: Candidate) => {
    edit(); setLatitude(String(candidate.latitude)); setLongitude(String(candidate.longitude)); setAddress(candidate.label);
  };
  const share = () => {
    const requestRevision = ++revision.current;
    setDirty(false);
    if (!navigator.geolocation) { setStatus("gpsError"); setManual(true); return; }
    setStatus("working");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current || requestRevision !== revision.current) return;
        void save({ enabled: true, latitude: position.coords.latitude, longitude: position.coords.longitude, precision });
      },
      () => { if (mounted.current && requestRevision === revision.current) { setStatus("gpsError"); setManual(true); } },
      { enableHighAccuracy: precision === "exact", timeout: 15000, maximumAge: 300000 },
    );
  };
  const stop = () => { revision.current += 1; setDirty(false); setCandidates([]); void save({ enabled: false }); };
  const button = "min-h-11 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
  const field = "mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white p-2 text-slate-900 dark:bg-slate-900 dark:text-white";
  const errors: Partial<Record<Status, string>> = {
    error: text("Could not confirm saving. Your input is kept; please retry.", "Speichern konnte nicht bestätigt werden. Deine Eingabe bleibt erhalten; bitte erneut versuchen."),
    notFound: text("No matching place found. Add a city or use the map.", "Kein passender Ort gefunden. Ergänze eine Stadt oder nutze die Karte."),
    lookupUnavailable: text("Place search is currently unavailable. Try again or use coordinates/the map.", "Die Ortssuche ist gerade nicht erreichbar. Versuche es erneut oder nutze Koordinaten/die Karte."),
    gpsError: text("Automatic location could not be determined. You can choose a location manually.", "Der automatische Standort konnte nicht ermittelt werden. Du kannst ihn manuell wählen."),
  };
  return <section className="space-y-4 rounded-2xl border border-cyan-300/50 bg-cyan-50/70 p-4 dark:border-cyan-400/30 dark:bg-cyan-500/10">
    <h3 className="flex items-center gap-2 font-bold"><Map size={19}/>{text("VIBE map", "VIBE-Karte")}</h3>
    <p className="text-sm">{text("VIBE uses your shared location to show who is where. Place searches and map tiles contact OpenStreetMap. Sharing is voluntary and can be stopped at any time.", "VIBE verwendet deinen freigegebenen Standort zur Anzeige, wer wo ist. Ortssuche und Kartenbilder kontaktieren OpenStreetMap. Die Freigabe ist freiwillig und jederzeit beendbar.")}</p>
    <p className="font-bold">{enabled ? text("Location sharing is active", "Standortfreigabe ist aktiv") : text("Location sharing is off", "Standortfreigabe ist aus")}</p>
    {enabled && <LocationUpdatedAt value={updatedAt} de={de}/>}
    <div className="grid grid-cols-2 gap-2">{["approximate", "exact"].map((value) => <button key={value} type="button" aria-pressed={precision === value} onClick={() => { if (precision !== value) { edit(); setPrecision(value); } }} className={precision === value ? button : "min-h-11 rounded-xl border border-cyan-500 px-3 py-2 text-sm font-bold"}>{value === "exact" ? text("Precise", "Genau") : text("Approximate", "Ungefähr")}</button>)}</div>
    <p className="flex gap-2 text-sm"><ShieldCheck size={16} className="shrink-0"/>{precision === "approximate" ? text("All locations, including addresses, are rounded to roughly 10 km. Street addresses are not retained. To recover a precise position later, select it again.", "Alle Standorte, auch Adressen, werden auf ungefähr 10 km gerundet. Straßenadressen werden nicht gespeichert. Für eine spätere genaue Position wähle den Ort erneut.") : text("The selected position is shared precisely. Choose Approximate if you do not want to share a street-level location.", "Die gewählte Position wird genau geteilt. Wähle Ungefähr, wenn du keinen straßengenauen Standort teilen möchtest.")}</p>
    <button type="button" className={button} aria-expanded={manual} onClick={() => setManual(!manual)}>{text("Choose a custom location", "Eigenen Standort wählen")}</button>
    {manual && <div className="space-y-3">
      <p className="text-sm">{text("Search for a place and choose a result, enter coordinates or tap the map. Your selection is saved automatically after a short pause.", "Suche einen Ort und wähle einen Treffer, gib Koordinaten ein oder tippe auf die Karte. Deine Auswahl wird nach kurzer Pause automatisch gespeichert.")}</p>
      <OpenStreetMap points={points} de={de} onPick={(a, b) => choose({ latitude: a, longitude: b, label: "" })}/>
      <div aria-live="polite" className="text-sm">
        {errors[status] && <p role="alert" className="font-bold text-red-700 dark:text-red-300">{errors[status]}</p>}
        {status === "working" && <p>{text("Saving…", "Wird gespeichert…")}</p>}
        {status === "searching" && <p>{text("Searching…", "Wird gesucht…")}</p>}
        {status === "saved" && <p className="font-bold text-emerald-700 dark:text-emerald-300">{enabled ? text("Location saved", "Standort gespeichert") : text("Location removed", "Standort entfernt")}</p>}
        {restored && <p>{text("Unfinished input restored. Review it and save or select a place.", "Nicht abgeschlossene Eingabe wiederhergestellt. Prüfe sie und speichere oder wähle einen Ort.")}</p>}
        {dirty && status === "idle" && !valid && <p>{text("Not saved yet. Choose a search result or complete both coordinates.", "Noch nicht gespeichert. Wähle einen Suchtreffer oder vervollständige beide Koordinaten.")}</p>}
      </div>
      <label className="block text-sm">{text("Address or place", "Adresse oder Ort")}<input maxLength={500} value={address} onChange={(e) => { edit(); setAddress(e.target.value); setLatitude(""); setLongitude(""); }} className={field}/></label>
      <button type="button" disabled={!address.trim() || status === "searching"} onClick={() => void search()} className={button}>{text("Find places", "Orte suchen")}</button>
      {candidates.length > 0 && <div className="space-y-2"><p className="text-sm font-bold">{text("Which place do you mean?", "Welchen Ort meinst du?")}</p>{candidates.map((candidate, index) => <button key={index} type="button" onClick={() => choose(candidate)} className="block min-h-11 w-full break-words rounded-xl border border-cyan-400/50 p-3 text-left text-sm hover:bg-cyan-500/10">{candidate.label}<span className="mt-1 block text-xs opacity-75">{candidate.latitude.toFixed(5)}, {candidate.longitude.toFixed(5)}</span></button>)}</div>}
      {valid && <p className="break-words text-sm">{text("Selected position:", "Gewählte Position:")} {address || `${latitude}, ${longitude}`}</p>}
      <div className="grid gap-3 sm:grid-cols-2">{[{ label: text("Latitude", "Breitengrad"), value: latitude, set: setLatitude }, { label: text("Longitude", "Längengrad"), value: longitude, set: setLongitude }].map((input) => <label key={input.label} className="text-sm">{input.label}<input inputMode="decimal" value={input.value} onChange={(e) => { edit(); input.set(e.target.value); setAddress(""); }} className={field}/></label>)}</div>
      <button type="button" disabled={!valid || status === "working"} onClick={() => { setDirty(false); void saveCurrent(); }} className={button}>{text("Save now / Retry", "Jetzt speichern / Erneut versuchen")}</button>
    </div>}
    {!manual && errors[status] && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{errors[status]}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={status === "working"} onClick={share} className={button}><LocateFixed size={16} className="mr-2 inline"/>{text("Use automatic location", "Automatischen Standort nutzen")}</button>
      {enabled && <button type="button" onClick={stop} className="min-h-11 rounded-xl border border-red-400 px-3 py-2 text-sm font-bold text-red-700 dark:text-red-300"><X size={16} className="mr-2 inline"/>{text("Stop sharing and remove location", "Freigabe beenden und Standort entfernen")}</button>}
      <Link href="/map" prefetch={false} className="inline-flex min-h-11 items-center rounded-xl border border-cyan-400 px-3 py-2 text-sm font-bold">{text("Open map", "Karte öffnen")}</Link>
    </div>
  </section>;
}
