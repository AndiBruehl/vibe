"use client";

import { LocateFixed, Map, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OpenStreetMap from "./OpenStreetMap";

export default function LocationSharingSettings({ initialEnabled, initialPrecision, initialLatitude, initialLongitude, initialAddress, language }: { initialEnabled: boolean; initialPrecision: string; initialLatitude?: number | null; initialLongitude?: number | null; initialAddress?: string | null; language: "en" | "de" }) {
  const router = useRouter();
  const de = language === "de";
  const [manual, setManual] = useState(false);
  const [latitude, setLatitude] = useState(initialLatitude == null ? "" : String(initialLatitude));
  const [longitude, setLongitude] = useState(initialLongitude == null ? "" : String(initialLongitude));
  const [address, setAddress] = useState(initialAddress ?? "");
  const lat = Number(latitude.replace(",", "."));
  const lng = Number(longitude.replace(",", "."));
  const valid = latitude.trim() !== "" && longitude.trim() !== "" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const points = useMemo(() => valid ? [{ latitude: lat, longitude: lng, label: de ? "Gewählter Standort" : "Selected location" }] : [], [valid, lat, lng, de]);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [precision, setPrecision] = useState(initialPrecision === "exact" ? "exact" : "approximate");
  const [status, setStatus] = useState<"idle" | "working" | "saved" | "error" | "notFound" | "lookupUnavailable">("idle");
  const [autoSaving, setAutoSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const revision = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const edit = () => { revision.current += 1; setDirty(true); setStatus("idle"); };
  const text = (en: string, german: string) => de ? german : en;
  const save = useCallback(async (payload: Record<string, unknown>) => {
    const requestRevision = revision.current;
    const previous = queue.current;
    let release!: () => void;
    queue.current = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    if (requestRevision !== revision.current) { release(); return false; }
    setStatus("working");
    try {
      const response = await fetch("/api/profile/location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
      const result = await response.json() as { error?: string; latitude?: number; longitude?: number; resolvedAddress?: string | null };
      if (requestRevision !== revision.current) return false;
      if (result.error === "AddressNotFound") { setStatus("notFound"); return false; }
      if (result.error === "AddressLookupUnavailable") { setStatus("lookupUnavailable"); return false; }
      if (!response.ok) throw new Error("Location could not be saved");
      if (typeof result.latitude === "number" && typeof result.longitude === "number") { setLatitude(String(result.latitude)); setLongitude(String(result.longitude)); }
      if (result.resolvedAddress) setAddress(result.resolvedAddress);
      setEnabled(payload.enabled === true);
      setDirty(false);
      setStatus("saved");
      router.refresh();
      return true;
    } catch { if (requestRevision === revision.current) setStatus("error"); return false; }
    finally { release(); }
  }, [router]);
  useEffect(() => {
    if (!manual || !dirty) return;
    const hasLocation = valid || address.trim().length > 0;
    if (!hasLocation) return;
    const timer = window.setTimeout(() => {
      setAutoSaving(true);
      void save({ enabled: true, ...(address.trim() ? { address: address.trim() } : { latitude: lat, longitude: lng }), precision, language: de ? "de" : "en" }).finally(() => setAutoSaving(false));
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [manual, dirty, latitude, longitude, address, precision, valid, lat, lng, de, save]);
  const share = () => {
    revision.current += 1; setDirty(false);
    if (!navigator.geolocation) { setStatus("error"); setManual(true); return; }
    setStatus("working");
    navigator.geolocation.getCurrentPosition(
      (position) => { void save({ enabled: true, latitude: position.coords.latitude, longitude: position.coords.longitude, precision, language: de ? "de" : "en" }).then((saved) => { if (saved) setEnabled(true); }); },
      () => { setStatus("error"); setManual(true); },
      { enableHighAccuracy: precision === "exact", timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  };
  const stop = () => { revision.current += 1; setDirty(false); void save({ enabled: false }).then((saved) => { if (saved) { setLatitude(""); setLongitude(""); setAddress(""); } }); };
  return <section className="rounded-2xl border border-cyan-300/50 bg-cyan-50/70 p-4 dark:border-cyan-400/30 dark:bg-cyan-500/10">
    <button type="button" className="mb-3 min-h-11 rounded-xl bg-cyan-600 px-4 py-2 font-bold text-white" aria-expanded={manual} onClick={() => setManual(!manual)}>{text("Choose a custom location", "Eigenen Standort wählen")}</button>
    {manual && <div className="mb-4 space-y-3 overflow-hidden rounded-xl border border-cyan-400/40 p-3">
      <p className="text-sm">{text("Choose either a place/address or coordinates. You can also tap the map. Changes are saved and shared automatically after a short pause. GPS is not required.", "Wähle entweder einen Ort/eine Adresse oder Koordinaten. Du kannst auch direkt auf die Karte tippen. Änderungen werden nach kurzer Pause automatisch gespeichert und freigegeben. GPS ist dafür nicht nötig.")}</p>
      <OpenStreetMap points={points} de={de} onPick={(a, b) => { edit(); setAddress(""); setLatitude(a.toFixed(5)); setLongitude(b.toFixed(5)); }}/>
      {status === "error" && <p role="alert" className="text-sm font-bold text-red-700 dark:text-red-300">{text("Could not save this location. Your previous saved location is unchanged. Please try again.", "Dieser Standort konnte nicht gespeichert werden. Dein bisheriger Standort bleibt erhalten. Bitte versuche es erneut.")}</p>}
      {status === "notFound" ? <p role="alert" className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">{text("We could not find that address. Try adding a city or choose a point on the map.", "Diese Adresse wurde leider nicht gefunden. Ergänze bitte eine Stadt oder wähle einen Punkt auf der Karte.")}</p> : null}{status === "lookupUnavailable" ? <p role="alert" className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">{text("The address lookup is temporarily unavailable. You can choose the location directly on the map or enter coordinates.", "Die Adresssuche ist gerade nicht erreichbar. Du kannst den Standort direkt auf der Karte wählen oder Koordinaten eingeben.")}</p> : null}
      <label className="block text-sm">{text("Address or place", "Adresse oder Ort")}{address.trim() && status === "saved" ? <span className="ml-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">{text("Address saved", "Adresse gespeichert")}</span> : autoSaving ? <span className="ml-2 text-xs font-bold text-cyan-700 dark:text-cyan-300">{text("Saving…", "Wird gespeichert…")}</span> : null}<input value={address} onChange={(e) => { edit(); setAddress(e.target.value); setLatitude(""); setLongitude(""); if (status === "saved" || status === "notFound" || status === "lookupUnavailable") setStatus("idle"); }} placeholder={text("e.g. Berlin, Germany", "z. B. Berlin, Deutschland")} className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white p-2 text-slate-900 dark:bg-slate-900 dark:text-white"/></label>
      <p className="text-center text-xs font-bold text-slate-500">{text("OR", "ODER")}</p>
      <div className="grid gap-3 sm:grid-cols-2">{[{ label: text("Latitude", "Breitengrad"), value: latitude, set: setLatitude }, { label: text("Longitude", "Längengrad"), value: longitude, set: setLongitude }].map((field) => <label key={field.label} className="text-sm">{field.label}<input inputMode="decimal" value={field.value} onChange={(e) => { edit(); field.set(e.target.value); setAddress(""); if (status === "saved" || status === "notFound") setStatus("idle"); }} className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white p-2 text-slate-900 dark:bg-slate-900 dark:text-white"/></label>)}</div>
      <button type="button" disabled={(!valid && !address.trim()) || status === "working"} onClick={() => { void save({ enabled: true, ...(address.trim() ? { address: address.trim() } : { latitude: lat, longitude: lng }), precision, language: de ? "de" : "en" }).then((saved) => { if (saved) setEnabled(true); }); }} className="min-h-11 rounded-xl bg-cyan-600 px-4 py-2 font-bold text-white disabled:opacity-50">{text("Save and share", "Speichern und freigeben")}</button>
    </div>}
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-600 text-white"><Map size={19}/></span><div><p className="font-bold text-slate-900 dark:text-white">{text("VIBE map", "VIBE-Karte")}</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{text("Share your location only if you want to appear on VIBE’s internal member map. VIBE uses the saved location to show who is where. Address searches are sent to OpenStreetMap; loading map tiles also contacts OpenStreetMap. You can stop sharing at any time.", "Teile deinen Standort nur, wenn du auf der internen VIBE-Karte erscheinen möchtest. VIBE verwendet den gespeicherten Standort zur Anzeige, wer wo ist. Adresssuchen werden an OpenStreetMap gesendet; auch Kartenbilder werden von OpenStreetMap geladen. Du kannst die Freigabe jederzeit beenden.")}</p></div></div>
    <div className="mt-4 grid grid-cols-2 rounded-xl bg-white/70 p-1 dark:bg-slate-950/30"><button type="button" onClick={() => setPrecision("approximate")} disabled={status === "working"} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${precision === "approximate" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300"}`}>{text("Approximate", "Ungefähr")}</button><button type="button" onClick={() => setPrecision("exact")} disabled={status === "working"} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${precision === "exact" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300"}`}>{text("More precise", "Genauer")}</button></div>
    <p className="mt-2 flex gap-1.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400"><ShieldCheck size={14} className="shrink-0 text-cyan-600 dark:text-cyan-300"/>{precision === "approximate" ? text("GPS and coordinate locations are rounded. Entered addresses retain their precise map position.", "GPS- und Koordinatenstandorte werden gerundet. Eingegebene Adressen behalten ihre genaue Kartenposition.") : text("More precise still means a map position, not a public address.", "Genauer bedeutet weiterhin eine Kartenposition, keine öffentliche Adresse.")}</p>
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={share} disabled={status === "working"} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white transition hover:bg-cyan-700 disabled:opacity-60"><LocateFixed size={16}/>{status === "working" ? text("Getting location…", "Standort wird ermittelt…") : enabled ? text("Update location", "Standort aktualisieren") : text("Share my location", "Standort freigeben")}</button>{enabled ? <button type="button" onClick={stop} disabled={status === "working"} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-400/60 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-500/10"><X size={16}/>{text("Stop sharing", "Freigabe beenden")}</button> : null}<Link href="/map" prefetch={false} aria-disabled={status === "working"} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-400/60 px-3 py-2 text-xs font-black text-cyan-700 transition hover:bg-cyan-100/70 dark:text-cyan-200 dark:hover:bg-cyan-500/15 ${status === "working" ? "pointer-events-none opacity-60" : ""}`}><Map size={16}/>{text("Open map", "Karte öffnen")}</Link></div>
    {status === "saved" ? <p role="status" className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">{enabled ? text("Location sharing is active.", "Standortfreigabe ist aktiv.") : text("Location sharing is off.", "Standortfreigabe ist beendet.")}</p> : null}{status === "error" && !manual ? <p role="alert" className="mt-3 text-xs font-bold text-red-700 dark:text-red-300">{text("VIBE could not access or save your location. Your previous saved location is unchanged. Please try again.", "VIBE konnte deinen Standort nicht abrufen oder speichern. Dein bisher gespeicherter Standort bleibt erhalten. Bitte versuche es erneut.")}</p> : null}
  </section>;
}
