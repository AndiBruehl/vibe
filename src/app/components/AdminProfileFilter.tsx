"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function AdminProfileFilter({ checked, query, sort }: { checked: boolean; query: string; sort: string }) {
  const router = useRouter();
  const de = useVibeLanguage() === "de";
  function setFilter(next: boolean) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (next) params.set("admin", "1");
    router.push(`/profiles${params.size ? `?${params}` : ""}`);
  }
  return <label className="group flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-400 hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-orange-500/10">
    <input type="checkbox" checked={checked} onChange={(event) => setFilter(event.target.checked)} className="peer sr-only" />
    <span className="grid size-5 place-items-center rounded-md border-2 border-slate-400 text-transparent transition peer-checked:border-orange-500 peer-checked:bg-linear-to-r peer-checked:from-(--ig-orange) peer-checked:to-(--ig-red) peer-checked:text-white"><Shield size={13} strokeWidth={3} /></span>
    <span>{de ? "Admins" : "Admins"}</span>
  </label>;
}
