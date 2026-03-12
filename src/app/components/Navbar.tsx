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
    <div className="block md:hidden fixed bottom-0 left-0 right-0">
      <div className="flex text-gray-700 dark:text-gray-300 *:flex *:items-center">
        <div className="pl-2 bg-white dark:bg-gray-700 rounded-t-xl w-full relative z-10 *:size-12 *:flex *:flex-col *:items-center *:justify-center justify-around pt-4">
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

        <div className="size-14 relative -top-4 justify-center w-[140px]">
          <div className="absolute bg-blue-500 bg-clip-text border-white dark:border-gray-700 border-t-transparent dark:border-t-transparent border-l-transparent dark:border-l-transparent border-[50px] rounded-full rotate-45">
            <div className="border-4 size-15 border-transparent">
              <Link
                href="/create"
                className="group -rotate-45 bg-gradient-to-tr from-ig-orange to-ig-red to-70% size-12 flex flex-col items-center justify-center text-white rounded-full"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-(--ig-orange) to-(--ig-red) shadow-md transition-transform duration-200 group-hover:scale-105">
                  <CameraIcon className="mt-25 size-10 text-white transition-transform duration-200 group-hover:scale-90  mb-25" />
                </div>{" "}
                <span className="mt-3 translate-y-3 text-[13px] font-extrabold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-tr from-[var(--ig-orange)] to-[var(--ig-red)] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                  CREATE
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pr-2 w-full bg-white dark:bg-gray-700 rounded-t-xl relative z-10 *:size-12 *:flex *:flex-col *:items-center *:justify-center justify-around pt-4">
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
