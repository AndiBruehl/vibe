"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  SearchIcon,
  PlusSquareIcon,
  LayoutGridIcon,
  UserIcon,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const linkBase =
    "group flex min-w-[56px] flex-col items-center no-underline transition-colors duration-200";

  const iconBase =
    "size-7 transition-transform duration-200 group-hover:scale-90";

  const textBase =
    "mt-1 text-[11px] font-medium tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-100";

  const gradient =
    "size-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-[var(--ig-orange)] to-[var(--ig-red)]";

  const gradientText =
    "bg-gradient-to-tr from-[var(--ig-orange)] to-[var(--ig-red)] bg-clip-text text-transparent";

  const activeClass = "text-[var(--ig-red)]";
  const inactiveClass = "text-black hover:text-slate-700";

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/70 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06 )]">
      <div className="mx-auto flex max-w-md items-center justify-center gap-10 px-6 py-2">
        <Link
          href="/"
          className={`${linkBase} ${
            pathname === "/" ? activeClass : inactiveClass
          }`}
        >
          <HomeIcon className={iconBase} />
          <span
            className={`${textBase} ${pathname === "/" ? "opacity-100" : ""}`}
          >
            HOME
          </span>
        </Link>

        <Link
          href="/search"
          className={`${linkBase} ${
            pathname.startsWith("/search") ? activeClass : inactiveClass
          }`}
        >
          <SearchIcon className={iconBase} />
          <span
            className={`${textBase} ${
              pathname.startsWith("/search") ? "opacity-100" : ""
            }`}
          >
            SEARCH
          </span>
        </Link>

        {/* CREATE */}

        <Link href="/create" className={linkBase}>
          <div className={`${gradient} p-0.5`}>
            <PlusSquareIcon className="size-7 text-white transition-transform duration-200 group-hover:scale-90" />
          </div>

          <span
            className={`${textBase} ${gradientText} ${
              pathname.startsWith("/create") ? "opacity-100" : ""
            }`}
          >
            CREATE
          </span>
        </Link>

        <Link
          href="/browse"
          className={`${linkBase} ${
            pathname.startsWith("/browse") ? activeClass : inactiveClass
          }`}
        >
          <LayoutGridIcon className={iconBase} />
          <span
            className={`${textBase} ${
              pathname.startsWith("/browse") ? "opacity-100" : ""
            }`}
          >
            BROWSE
          </span>
        </Link>

        <Link
          href="/profile"
          className={`${linkBase} ${
            pathname.startsWith("/profile") ? activeClass : inactiveClass
          }`}
        >
          <UserIcon className={iconBase} />
          <span
            className={`${textBase} ${
              pathname.startsWith("/profile") ? "opacity-100" : ""
            }`}
          >
            PROFILE
          </span>
        </Link>
      </div>
    </nav>
  );
}
