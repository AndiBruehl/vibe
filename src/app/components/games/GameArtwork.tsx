import Image from "next/image";

export type VibeGame = "reflex" | "trail" | "stack" | "glide";
export type ReflexSignalState = "idle" | "waiting" | "go" | "false-start" | "between" | "finished";

export function ReflexOrbit({ state = "idle", compact = false }: { state?: ReflexSignalState; compact?: boolean }) {
  const isGo = state === "go";
  const isFalseStart = state === "false-start";
  const outerTone = isGo
    ? "border-emerald-200/60 bg-emerald-400/15 shadow-[0_0_70px_rgba(74,222,128,0.35)]"
    : isFalseStart
      ? "border-rose-200/50 bg-rose-400/10 shadow-[0_0_70px_rgba(251,113,133,0.3)]"
      : "border-violet-300/30 bg-violet-400/10 shadow-[0_0_70px_rgba(139,92,246,0.25)]";
  const innerTone = isGo
    ? "border-emerald-100/60 bg-linear-to-br from-emerald-300/30 to-lime-400/10"
    : isFalseStart
      ? "border-rose-200/45 bg-linear-to-br from-rose-400/20 to-rose-900/10"
      : "border-violet-200/40 bg-linear-to-br from-violet-500/40 to-fuchsia-400/20";

  return (
    <div className={`relative grid ${compact ? "size-24 md:size-32" : "size-32 sm:size-40"} place-items-center rounded-full border ${outerTone}`}>
      <div className={`grid ${compact ? "size-16 md:size-24" : "size-24 sm:size-32"} place-items-center rounded-full border ${innerTone}`}>
        <Image
          src="/logo.svg"
          alt=""
          width={1536}
          height={1024}
          className={`relative z-10 h-auto object-contain ${compact ? "w-20 md:w-28" : "w-28 sm:w-36"} ${isGo ? "drop-shadow-[0_0_20px_rgba(74,222,128,0.85)]" : isFalseStart ? "drop-shadow-[0_0_18px_rgba(251,113,133,0.8)]" : "drop-shadow-[0_0_14px_rgba(251,146,60,0.7)]"}`}
        />
      </div>
    </div>
  );
}

const trailTiles = new Map<number, "body" | "head" | "logo">([
  [16, "logo"],
  [18, "body"],
  [25, "body"],
  [32, "body"],
  [31, "body"],
  [30, "head"],
]);

const stackTiles = new Map<number, string>([
  [34, "bg-fuchsia-300"], [35, "bg-fuchsia-300"], [36, "bg-fuchsia-300"], [45, "bg-fuchsia-300"],
  [90, "bg-cyan-300"], [91, "bg-cyan-300"], [92, "bg-cyan-300"], [94, "bg-cyan-300"], [95, "bg-cyan-300"], [96, "bg-cyan-300"], [97, "bg-cyan-300"], [98, "bg-cyan-300"], [99, "bg-cyan-300"],
  [80, "bg-violet-300"], [81, "bg-violet-300"], [84, "bg-violet-300"], [85, "bg-violet-300"], [86, "bg-violet-300"], [87, "bg-violet-300"], [89, "bg-violet-300"],
  [70, "bg-fuchsia-300"], [71, "bg-fuchsia-300"], [74, "bg-fuchsia-300"], [78, "bg-fuchsia-300"], [79, "bg-fuchsia-300"],
  [60, "bg-violet-300"], [69, "bg-violet-300"], [50, "bg-cyan-300"], [59, "bg-cyan-300"],
]);

function ReflexArtwork() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden rounded-[1.35rem] bg-[#11132d]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(124,58,237,0.36),transparent_55%)]" />
      <span className="absolute left-[18%] top-[22%] size-2 rounded-full bg-fuchsia-300/70" />
      <span className="absolute right-[20%] top-[31%] size-1.5 rounded-full bg-amber-200/80" />
      <span className="absolute bottom-[23%] left-[28%] size-1.5 rounded-full bg-cyan-200/80" />
      <ReflexOrbit />
      <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-violet-100/80">WAIT FOR THE GLOW</div>
    </div>
  );
}

function TrailArtwork() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden rounded-[1.35rem] bg-[#10172b]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_40%,rgba(34,211,238,0.15),transparent_60%)]" />
      <div className="relative grid grid-cols-7 gap-1 rounded-2xl border border-white/10 bg-slate-950/50 p-2 shadow-2xl sm:gap-1.5 sm:p-3">
        {Array.from({ length: 49 }, (_, index) => {
          const tile = trailTiles.get(index);
          const base = "relative grid aspect-square size-5 place-items-center overflow-hidden rounded sm:size-6 sm:rounded-md";
          const color = tile === "head"
            ? "bg-linear-to-br from-cyan-200 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.55)]"
            : tile === "body"
              ? "bg-linear-to-br from-violet-400 to-indigo-500 shadow-[0_0_12px_rgba(129,140,248,0.28)]"
              : tile === "logo"
              ? "z-10 border border-amber-200 bg-[#10121f] shadow-[0_0_18px_rgba(251,191,36,0.65)]"
                : "bg-white/[0.035]";

          return (
            <span key={index} className={`${base} ${color}`}>
              {tile === "head" && <span className="size-2 rounded-sm bg-cyan-50 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />}
              {tile === "logo" && <Image src="/logo.svg" alt="" width={1536} height={1024} className="h-full w-full scale-[1.8] object-contain" />}
            </span>
          );
        })}
      </div>
      <span className="absolute bottom-3 right-4 text-[10px] font-black tracking-[0.2em] text-cyan-100/70">FOLLOW THE VIBE</span>
    </div>
  );
}

function StackArtwork() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden rounded-[1.35rem] bg-[#17132a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_35%,rgba(217,70,239,0.18),transparent_60%)]" />
      <div className="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 p-2 shadow-2xl sm:gap-3 sm:p-3">
        <div className="grid grid-cols-10 gap-[3px] rounded-xl border border-white/[0.07] bg-[#0b1021] p-1.5 sm:p-2">
        {Array.from({ length: 120 }, (_, index) => {
          const color = stackTiles.get(index);
          return (
            <span key={index} className={`grid aspect-square size-3.5 place-items-center overflow-hidden rounded-[3px] sm:size-4 md:size-[18px] ${color ?? "bg-white/[0.035]"}`}>
              {color && <Image src="/logo.svg" alt="" width={1536} height={1024} className="h-full w-full scale-[1.8] object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.35)]" />}
            </span>
          );
        })}
        </div>
        <div className="hidden w-14 shrink-0 flex-col gap-2 sm:flex">
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-fuchsia-100/70">NEXT</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-white/[0.035] p-1.5">
            {[1, 3, 4, 5].map((cell) => <span key={cell} className="aspect-square rounded-[2px] bg-violet-300">
              <Image src="/logo.svg" alt="" width={1536} height={1024} className="h-full w-full scale-[1.8] object-contain" />
            </span>)}
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/45">LINES</span>
          <span className="text-sm font-black tabular-nums text-white/80">04</span>
        </div>
      </div>
      <span className="absolute bottom-3 right-4 text-[10px] font-black tracking-[0.2em] text-fuchsia-100/70">VIBE STACK · SOLO</span>
    </div>
  );
}

function GlideArtwork() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden rounded-[1.35rem] bg-[#10101f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_48%,rgba(255,82,141,0.23),transparent_34%),linear-gradient(155deg,#17152f,#10172b_58%,#21112c)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.13)_1px,transparent_1px)] [background-size:30px_30px]" />
      <span className="absolute left-[24%] top-[43%] z-10 -rotate-6 drop-shadow-[0_0_18px_rgba(255,102,139,0.8)]">
        <Image src="/logo.svg" alt="" width={1536} height={1024} className="h-auto w-24 sm:w-32" />
      </span>
      <div aria-hidden="true" className="absolute left-[56%] top-0 h-[35%] w-10 rounded-b-xl border-x border-b border-cyan-100/35 bg-linear-to-r from-cyan-400/75 via-teal-300/80 to-cyan-500/70 shadow-[0_0_26px_rgba(34,211,238,0.32)] sm:w-14" />
      <div aria-hidden="true" className="absolute bottom-0 left-[56%] h-[32%] w-10 rounded-t-xl border-x border-t border-cyan-100/35 bg-linear-to-r from-cyan-400/75 via-teal-300/80 to-cyan-500/70 shadow-[0_0_26px_rgba(34,211,238,0.32)] sm:w-14" />
      <span className="absolute left-[40%] top-[34%] h-px w-[17%] rotate-6 bg-linear-to-r from-[#ff568b]/0 via-[#ff8c70] to-cyan-300/80" />
      <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] text-white/70">FLIGHT / 01</span>
      <span className="absolute bottom-3 right-4 text-[10px] font-black tracking-[0.2em] text-cyan-100/70">KEEP THE VIBE AIRBORNE</span>
    </div>
  );
}

export default function GameArtwork({ game }: { game: VibeGame }) {
  return (
    <div aria-hidden="true" className="aspect-[1.55] w-full">
      {game === "reflex" ? <ReflexArtwork /> : game === "trail" ? <TrailArtwork /> : game === "stack" ? <StackArtwork /> : <GlideArtwork />}
    </div>
  );
}
