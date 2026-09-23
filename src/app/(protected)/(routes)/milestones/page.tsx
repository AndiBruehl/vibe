import Link from "next/link";
import { Award, MoveLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { syncProfileMilestones } from "@/profile-milestones";
import MilestoneList from "@/app/components/MilestoneList";
import { redirect } from "next/navigation";

export default async function MilestonesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  await syncProfileMilestones(session.user.email);
  const profile = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { milestoneBadges: true, hiddenMilestoneBadges: true } });
  const earned = Array.isArray(profile?.milestoneBadges) ? profile.milestoneBadges : [];
  const hidden = Array.isArray(profile?.hiddenMilestoneBadges) ? profile.hiddenMilestoneBadges : [];
  return <main className="mx-auto w-full max-w-2xl pb-24 md:pb-8"><Link href="/settings" className="group inline-flex min-h-11 items-center gap-2 text-slate-700 no-underline hover:text-orange-600 dark:text-slate-300"><MoveLeft size={19}/><span className="opacity-0 transition-opacity group-hover:opacity-100">Back to Settings</span></Link><section className="mt-5 rounded-3xl border border-violet-400/30 bg-linear-to-br from-violet-50 to-white p-5 shadow-sm dark:from-violet-500/10 dark:to-slate-900"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-violet-600 text-white"><Award size={22}/></span><div><p className="text-xs font-bold tracking-[.16em] text-violet-700 dark:text-violet-200">VIBE MILESTONES</p><h1 className="text-2xl font-black text-slate-900 dark:text-white">Your milestones</h1></div></div><p className="mt-4 text-sm text-slate-600 dark:text-slate-300">See every milestone, understand how to earn it, and choose whether completed milestones appear alongside your name.</p><MilestoneList earned={earned} hidden={hidden}/></section></main>;
}
