import Link from "next/link";

export default function FeedModeSwitch({
  feedMode,
}: {
  feedMode: "following" | "for-you";
}) {
  const tabClass = (active: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${
      active
        ? "bg-linear-to-r from-(--ig-orange) to-(--ig-red) text-white shadow-md"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    }`;

  return (
    <nav
      aria-label="Feed selection"
      className="mb-5 inline-flex rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-slate-800/70 dark:shadow-black/20"
    >
      <Link href="/home?feed=following" className={tabClass(feedMode === "following")}>
        Following
      </Link>
      <Link href="/home?feed=for-you" className={tabClass(feedMode === "for-you")}>
        For you
      </Link>
    </nav>
  );
}
