import { respondToFollowRequest } from "@/actions";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { UserRoundCheck } from "lucide-react";

type FollowRequestsProps = { profileId: string; language: "en" | "de" };

export default async function FollowRequests({ profileId, language }: FollowRequestsProps) {
  const requests = await prisma.followRequest.findMany({
    where: { followingId: profileId },
    include: { follower: { select: { username: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (!requests.length) return null;
  const de = language === "de";

  return <section id="follow-requests" className="scroll-mt-6 mx-auto mt-7 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="mb-4 flex items-center gap-2"><UserRoundCheck size={18} className="text-orange-500" /><h2 className="font-bold text-slate-900 dark:text-white">{de ? "Follow-Anfragen" : "Follow requests"}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{requests.length}</span></div>
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {requests.map((request) => <div key={request.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
        <div className="size-10 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">{request.follower.avatar ? <Image src={request.follower.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized /> : null}</div>
        <Link href={request.follower.username ? `/profile/${encodeURIComponent(request.follower.username)}` : "/profile"} className="min-w-0 flex-1 font-semibold text-slate-900 hover:underline dark:text-white">{request.follower.name || request.follower.username || (de ? "Nutzer" : "User")} {request.follower.username ? <span className="font-normal text-slate-500 dark:text-slate-400">@{request.follower.username}</span> : null}</Link>
        <div className="flex gap-2"><form action={respondToFollowRequest}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="accept" /><button className="rounded-xl bg-linear-to-r from-orange-500 to-pink-500 px-3 py-2 text-xs font-bold text-white">{de ? "Annehmen" : "Accept"}</button></form><form action={respondToFollowRequest}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="decline" /><button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">{de ? "Ablehnen" : "Decline"}</button></form></div>
      </div>)}
    </div>
  </section>;
}
