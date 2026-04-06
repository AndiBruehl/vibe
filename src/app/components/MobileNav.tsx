"use client";

import {
  CameraIcon,
  HomeIcon,
  LayoutGridIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

export default function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
      {" "}
      <div className="flex text-gray-700 dark:text-gray-300 *:flex *:items-center">
        <div className="pl-2 bg-white dark:bg-gray-800 rounded-t-xl w-full relative z-10 *:size-12 *:flex *:flex-col *:items-center *:justify-center justify-around pt-4">
          <Link href="/" className="group">
            <HomeIcon className="transition-transform duration-200 group-hover:scale-90" />
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              HOME
            </span>
          </Link>

          <Link href="/search" className="group">
            <SearchIcon className="transition-transform duration-200 group-hover:scale-90" />
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              SEARCH
            </span>
          </Link>
        </div>

        <div className="size-14 relative -top-4 justify-center w-35">
          <div className="absolute bg-blue-500 bg-clip-text border-white dark:border-gray-800 border-t-transparent dark:border-t-transparent border-l-transparent dark:border-l-transparent border-50 rounded-full rotate-45">
            <div className="border-4 size-15 border-transparent">
              <Link
                href="/create"
                className="group -rotate-45 bg-linear-to-tr from-ig-orange to-ig-red to-70% size-12 flex flex-col items-center justify-center text-white rounded-full"
              >
                <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
                  <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) transition-opacity duration-300 group-hover:opacity-0" />
                  <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <CameraIcon className="relative z-10 size-8 text-white transition-transform duration-200 group-hover:scale-90" />{" "}
                <span className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-[13px] font-extrabold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-200 bg-linear-to-tr from-(--ig-orange) to-(--ig-red) bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)] whitespace-nowrap pointer-events-none">
                  CREATE
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pr-2 w-full bg-white dark:bg-gray-800 rounded-t-xl relative z-10 *:size-12 *:flex *:flex-col *:items-center *:justify-center justify-around pt-4">
          <Link
            href="/browse"
            className="group text-ig-red dark:text-ig-orange"
          >
            <LayoutGridIcon className="transition-transform duration-200 group-hover:scale-90" />
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              BROWSE
            </span>
          </Link>

          <Link href="/profile" className="group">
            <UserIcon className="transition-transform duration-200 group-hover:scale-90" />
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              PROFILE
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
