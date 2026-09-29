import { auth } from "@/auth";
import { prisma } from "@/db";
import { redirect } from "next/navigation";
import { Map } from "lucide-react";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import MemberMap from "@/app/components/MemberMap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MapPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const viewer = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { language: true } });
  const de = viewer?.language === "de";
  const members = await prisma.profile.findMany({ where: { locationSharingEnabled: true }, select: { id: true, name: true, username: true, avatar: true, isSystem: true, locationLatitude: true, locationLongitude: true, locationPrecision: true, locationUpdatedAt: true } });
  const visibleMembers = members.filter((member): member is typeof member & { locationLatitude: number; locationLongitude: number } => member.isSystem !== true && Number.isFinite(member.locationLatitude) && Number.isFinite(member.locationLongitude));
  return <main className="mx-auto w-full max-w-5xl pb-24 md:pb-8"><div className="mb-3 min-h-11 pr-16"><BackNavigationLink language={de ? "de" : "en"} fallbackHref="/settings?tab=appearance&section=general" /></div><header className="mb-5 flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-cyan-500 text-white"><Map size={21}/></span><div><h1 className="text-2xl font-black text-slate-900 dark:text-white">{de ? "VIBE-Karte" : "VIBE map"}</h1><p className="text-sm text-slate-500 dark:text-slate-400">{de ? "Mitglieder, die ihren Standort freiwillig teilen." : "Members who voluntarily share their location."}</p></div></div></header><MemberMap de={de} members={visibleMembers.map((member) => ({ id: member.id, name: member.name || member.username || "VIBE", username: member.username, avatar: member.avatar, latitude: member.locationPrecision === "exact" ? member.locationLatitude : Number(member.locationLatitude.toFixed(1)), longitude: member.locationPrecision === "exact" ? member.locationLongitude : Number(member.locationLongitude.toFixed(1)), updatedAt: member.locationUpdatedAt?.toISOString() ?? null, precision: member.locationPrecision }))}/></main>;
}
