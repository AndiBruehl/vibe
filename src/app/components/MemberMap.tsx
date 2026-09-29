"use client";
import Link from "next/link";
import LocationUpdatedAt from "./LocationUpdatedAt";
import { useMemo } from "react";
import OpenStreetMap from "./OpenStreetMap";
type Member = { id: string; name: string; username: string | null; avatar: string | null; latitude: number; longitude: number; precision: string; updatedAt: string | null };
export default function MemberMap({ members, de }: { members: Member[]; de: boolean }) {
  const points = useMemo(() => members.map((m) => ({ ...m, label: m.name })), [members]);
  return <section className="overflow-hidden rounded-3xl border border-cyan-400/40 bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
    <p className="p-4 font-bold">{members.length} {de ? "sichtbar · Freiwillig geteilte Standorte" : "visible · Voluntarily shared locations"}</p>
    <OpenStreetMap points={points} de={de}/>
    <div className="space-y-3 p-4">{members.length ? members.map((m) => <div key={m.id} className="flex flex-wrap items-center justify-between gap-2"><div><span>{m.name}</span><LocationUpdatedAt value={m.updatedAt} de={de}/></div>{m.username && <Link className="text-cyan-700 dark:text-cyan-300" href={`/profile/${encodeURIComponent(m.username)}`}>{de ? "Profil öffnen" : "Open profile"}</Link>}</div>) : <p>{de ? "Noch niemand teilt einen Standort." : "No member is sharing a location yet."}</p>}</div>
  </section>;
}
