"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import styles from "./OpenStreetMap.module.css";

type Point = { latitude: number; longitude: number; label: string };
export default function OpenStreetMap({ points, de, onPick }: { points: Point[]; de: boolean; onPick?: (latitude: number, longitude: number) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick);
  const [failed, setFailed] = useState(false);
  useEffect(() => { pick.current = onPick; }, [onPick]);
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    let observer: ResizeObserver | undefined;
    void import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      map = L.map(container.current, { scrollWheelZoom: false }).setView([30, 0], 2);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on("tileerror", () => setFailed(true)).addTo(map);
      const valid = points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
      const grouped = new Map<string, Point[]>();
      valid.forEach((p) => { const key = `${p.latitude},${p.longitude}`; grouped.set(key, [...(grouped.get(key) ?? []), p]); });
      grouped.forEach((group) => {
        const content = document.createElement("div");
        group.forEach((p) => { const row = document.createElement("p"); row.textContent = p.label; content.append(row); });
        L.circleMarker([group[0].latitude, group[0].longitude], { radius: 12, color: "#ffffff", fillColor: "#0891b2", fillOpacity: 1, weight: 3 }).bindPopup(content).addTo(map!);
      });
      if (valid.length) map.fitBounds(L.latLngBounds(valid.map((p) => [p.latitude, p.longitude])), { padding: [32, 32], maxZoom: 12 });
      map.on("click", (event: import("leaflet").LeafletMouseEvent) => pick.current?.(event.latlng.lat, event.latlng.wrap().lng));
      observer = new ResizeObserver(() => map?.invalidateSize());
      observer.observe(container.current);
    }).catch(() => setFailed(true));
    return () => { disposed = true; observer?.disconnect(); map?.remove(); };
  }, [points]);
  return <div className="relative isolate">
    <div ref={container} className={`${styles.map} h-[50vh] min-h-80 w-full`} aria-label={de ? "Interaktive OpenStreetMap-Karte" : "Interactive OpenStreetMap"}/>
    {onPick && points.length === 0 && <p className="pointer-events-none absolute left-16 right-4 top-4 z-[500] rounded-xl bg-slate-950/85 px-3 py-2 text-center text-sm font-bold text-white shadow-lg">{de ? "Noch kein Pin gesetzt – tippe auf die Karte, um deinen Standort zu wählen." : "No pin set yet — tap the map to choose your location."}</p>}
    {onPick && points.length > 0 && <p className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-xl bg-emerald-950/85 px-3 py-2 text-center text-sm font-bold text-emerald-100 shadow-lg">{de ? "Ein Pin ist bereits gesetzt. Tippe auf die Karte, um ihn zu verschieben." : "A pin is already set. Tap the map to move it."}</p>}
    {failed && <p role="status" className="bg-slate-100 p-3 text-sm text-slate-900 dark:bg-slate-800 dark:text-white">{de ? "Kartenbilder konnten nicht geladen werden. Du kannst weiterhin Koordinaten eingeben." : "Map tiles could not be loaded. You can still enter coordinates."}</p>}
  </div>;
}
