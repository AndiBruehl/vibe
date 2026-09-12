"use client";

import {
  BellIcon,
  CameraIcon,
  HomeIcon,
  LayoutGridIcon,
  MessageCircleIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import MessageUnreadBadge from "@/app/components/MessageUnreadBadge";
import ActivityUnreadBadge from "@/app/components/ActivityUnreadBadge";
import useVibeLanguage, { type VibeLanguage } from "@/app/components/useVibeLanguage";

type DesktopNavProps = {
  unreadConversationCount?: number;
  unreadActivityCount?: number;
  initialLanguage?: VibeLanguage;
};

export default function DesktopNav({
  unreadConversationCount = 0,
  unreadActivityCount = 0,
  initialLanguage = "en",
}: DesktopNavProps) {
  const language = useVibeLanguage(initialLanguage);
  const labels = language === "de"
    ? { home: "Startseite", activity: "Aktivität", search: "Suche", create: "Erstellen", browse: "Entdecken", messages: "Nachrichten", profile: "Profil" }
    : { home: "Home", activity: "Activity", search: "Search", create: "Create", browse: "Browse", messages: "Messages", profile: "Profile" };
  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:block md:h-screen md:w-44 bg-ig-nav border-r border-slate-200 px-3 py-4 dark:border-slate-700">
      <div className="flex flex-col gap-1">
        <Link
          href="/home"
          className="group flex items-center  rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Image
            src="/logo.svg"
            alt="logo"
            width={120}
            height={120}
            className="mx-auto w-20"
          />{" "}
        </Link>{" "}
        <Link
          href="/home"
          className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-700 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <HomeIcon className="relative z-10 size-4 text-slate-900 dark:text-slate-100 group-hover:text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-sm font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            {labels.home}
          </span>
        </Link>
        <Link
          href="/activity"
          className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-700 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <BellIcon className="relative z-10 size-4 text-slate-900 dark:text-slate-100 group-hover:text-white transition-transform duration-200 group-hover:scale-90" />
            <ActivityUnreadBadge initialCount={unreadActivityCount} className="absolute -right-1 -top-1 z-20 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ring-2 ring-white dark:ring-gray-800" />
          </div>

          <span className="text-sm font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            {labels.activity}
          </span>
        </Link>
        <Link
          href="/search"
          className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-700 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <SearchIcon className="relative z-10 size-4 text-slate-900 dark:text-slate-100 group-hover:text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-sm font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            {labels.search}
          </span>
        </Link>
        <Link
          href="/create"
          className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <CameraIcon className="relative z-10 size-4 text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-sm font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            {labels.create}
          </span>
        </Link>
        <Link
          href="/browse"
          className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-700 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <LayoutGridIcon className="relative z-10 size-4 text-slate-900 dark:text-slate-100 group-hover:text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-sm font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            {labels.browse}
          </span>
        </Link>
        <Link
          href="/messages"
          className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-700 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <MessageCircleIcon className="relative z-10 size-4 text-slate-900 dark:text-slate-100 group-hover:text-white transition-transform duration-200 group-hover:scale-90" />
            <MessageUnreadBadge
              initialCount={unreadConversationCount}
              className="absolute -right-1 -top-1 z-20 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ring-2 ring-white dark:ring-gray-800"
            />
          </div>

          <span className="text-sm font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            {labels.messages}
          </span>
        </Link>
        <Link
          href="/profile"
          className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-700 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <UserIcon className="relative z-10 size-4 text-slate-900 dark:text-slate-100 group-hover:text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-sm font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            {labels.profile}
          </span>
        </Link>
      </div>
    </aside>
  );
}
