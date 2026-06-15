"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import img1 from "../profile/default.jpg";
import LocalTime from "@/app/components/LocalTime";

type Props = {
  conversation: any;
  currentUserId: string;
};

export default function ConversationListItem({
  conversation,
  currentUserId,
}: Props) {
  const router = useRouter();

  const otherParticipant = conversation.participants.find(
    (participant: any) => participant.profileId !== currentUserId,
  );
  const currentParticipant = conversation.participants.find(
    (participant: any) => participant.profileId === currentUserId,
  );
  const otherProfile = otherParticipant?.profile;
  const latestMessage = conversation.messages[0];
  const isUnread =
    latestMessage &&
    latestMessage.senderId !== currentUserId &&
    (!currentParticipant?.lastReadAt ||
      latestMessage.createdAt > currentParticipant.lastReadAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/messages/${conversation.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          router.push(`/messages/${conversation.id}`);
      }}
      className={`flex items-center gap-4 px-5 py-4 transition cursor-pointer ${
        isUnread
          ? "bg-red-50/80 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30"
          : "hover:bg-slate-50 dark:hover:bg-gray-700"
      }`}
    >
      <div
        className={`relative size-12 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${
          isUnread ? "ring-2 ring-red-500 ring-offset-2" : ""
        } ring-offset-white dark:ring-offset-gray-800`}
      >
        <Image
          src={conversation.isGroup ? img1.src : otherProfile?.avatar || img1.src}
          alt={conversation.isGroup ? `${conversation.name || "Group"} avatar` : otherProfile?.name || "User avatar"}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p
            className={`truncate text-slate-800 dark:text-slate-100 ${
              isUnread ? "font-bold" : "font-semibold"
            }`}
          >
            {conversation.isGroup ? (
              conversation.name || "Group"
            ) : otherProfile?.username ? (
              <Link
                href={`/profile/${otherProfile.username}`}
                onClick={(e) => e.stopPropagation()}
                className="no-underline hover:underline"
              >
                {otherProfile?.name || otherProfile?.username}
              </Link>
            ) : (
              otherProfile?.name || otherProfile?.username || "Unknown user"
            )}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            {isUnread ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                New
              </span>
            ) : null}
            <span className="text-xs text-slate-400">
              {latestMessage ? (
                <LocalTime
                  iso={latestMessage.createdAt}
                  options={{ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }}
                />
              ) : (
                ""
              )}
            </span>
          </div>
        </div>
        <p
          className={`truncate text-sm ${
            isUnread
              ? "font-semibold text-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {conversation.isGroup ? (
            latestMessage ? (
              <>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mr-1">
                  {latestMessage.sender?.name || latestMessage.sender?.username || "Someone"}:
                </span>
                <span className="truncate">{latestMessage.body}</span>
              </>
            ) : (
              "Start the conversation."
            )
          ) : (
            latestMessage?.body || "Start the conversation."
          )}
        </p>
      </div>
    </div>
  );
}
