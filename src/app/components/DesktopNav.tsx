import {
  CameraIcon,
  HomeIcon,
  LayoutGridIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DesktopNav() {
  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:block md:h-screen md:w-46 bg-white px-4 py-6 shadow-md shadow-gray-300 dark:bg-gray-800 dark:shadow-gray-700">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="group flex items-center  rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Image
            src="/logo.svg"
            alt="logo"
            width={120}
            height={120}
            className="mx-auto"
          />{" "}
        </Link>{" "}
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--ig-red)] to-[var(--ig-orange)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <HomeIcon className="relative z-10 size-5 text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-[18px] font-normal text-black transition-all duration-200 group-hover:bg-gradient-to-tr group-hover:from-[var(--ig-orange)] group-hover:to-[var(--ig-red)] group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            Home
          </span>
        </Link>
        <Link
          href="/search"
          className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--ig-red)] to-[var(--ig-orange)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <SearchIcon className="relative z-10 size-5 text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-[18px] font-normal text-black transition-all duration-200 group-hover:bg-gradient-to-tr group-hover:from-[var(--ig-orange)] group-hover:to-[var(--ig-red)] group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            Search
          </span>
        </Link>
        <Link
          href="/create"
          className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--ig-orange)] to-[var(--ig-red)] transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--ig-red)] to-[var(--ig-orange)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <CameraIcon className="relative z-10 size-5 text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-[18px] font-normal text-black transition-all duration-200 group-hover:bg-gradient-to-tr group-hover:from-[var(--ig-orange)] group-hover:to-[var(--ig-red)] group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            Create
          </span>
        </Link>
        <Link
          href="/browse"
          className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--ig-red)] to-[var(--ig-orange)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <LayoutGridIcon className="relative z-10 size-5 text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-[18px] font-normal text-black transition-all duration-200 group-hover:bg-gradient-to-tr group-hover:from-[var(--ig-orange)] group-hover:to-[var(--ig-red)] group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            Browse
          </span>
        </Link>
        <Link
          href="/profile"
          className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 rounded-full transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--ig-red)] to-[var(--ig-orange)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <UserIcon className="relative z-10 size-5 text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span className="text-[18px] font-normal text-black transition-all duration-200 group-hover:bg-gradient-to-tr group-hover:from-[var(--ig-orange)] group-hover:to-[var(--ig-red)] group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
            Profile
          </span>
        </Link>
      </div>
    </aside>
  );
}
