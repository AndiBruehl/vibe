export type VibeGame = "reflex" | "trail" | "stack";

const trailTiles = new Map<number, "body" | "head" | "logo">([
  [16, "logo"],
  [18, "body"],
  [25, "body"],
  [32, "body"],
  [31, "body"],
  [30, "head"],
]);

const stackTiles = new Map<number, string>([
  [11, "bg-fuchsia-300"], [12, "bg-fuchsia-300"], [18, "bg-fuchsia-300"], [19, "bg-fuchsia-300"],
  [26, "bg-violet-300"], [27, "bg-violet-300"], [28, "bg-violet-300"], [35, "bg-violet-300"],
  [36, "bg-cyan-300"], [37, "bg-cyan-300"], [38, "bg-cyan-300"], [45, "bg-cyan-300"],
]);

function ReflexArtwork() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden rounded-[1.35rem] bg-[#11132d]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(124,58,237,0.36),transparent_55%)]" />
      <span className="absolute left-[18%] top-[22%] size-2 rounded-full bg-fuchsia-300/70" />
      <span className="absolute right-[20%] top-[31%] size-1.5 rounded-full bg-amber-200/80" />
      <span className="absolute bottom-[23%] left-[28%] size-1.5 rounded-full bg-cyan-200/80" />
      <div className="relative grid size-32 place-items-center rounded-full border border-violet-300/30 bg-violet-400/10 shadow-[0_0_70px_rgba(139,92,246,0.25)] sm:size-40">
        <div className="grid size-24 place-items-center rounded-full border border-violet-200/40 bg-linear-to-br from-violet-500/40 to-fuchsia-400/20 sm:size-32">
          <span className="grid size-16 place-items-center rounded-full bg-linear-to-br from-amber-300 to-orange-500 text-xl font-black text-slate-950 shadow-lg shadow-orange-400/30 sm:size-20 sm:text-2xl">V</span>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-violet-100/80">WAIT FOR THE GLOW</div>
      <div className="absolute right-4 top-4 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70">01—05</div>
    </div>
  );
}

function TrailArtwork() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden rounded-[1.35rem] bg-[#10172b]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_40%,rgba(34,211,238,0.15),transparent_60%)]" />
      <div className="relative grid grid-cols-7 gap-1 rounded-2xl border border-white/10 bg-slate-950/50 p-3 shadow-2xl sm:gap-1.5 sm:p-4">
        {Array.from({ length: 49 }, (_, index) => {
          const tile = trailTiles.get(index);
          const base = "grid aspect-square size-5 place-items-center rounded-[5px] sm:size-7 sm:rounded-md";
          const color = tile === "head"
            ? "bg-linear-to-br from-cyan-200 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.55)]"
            : tile === "body"
              ? "bg-linear-to-br from-violet-400 to-indigo-500 shadow-[0_0_12px_rgba(129,140,248,0.28)]"
              : tile === "logo"
                ? "bg-linear-to-br from-amber-300 to-orange-500 text-[6px] font-black text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.4)] sm:text-[7px]"
                : "bg-white/[0.035]";

          return <span key={index} className={`${base} ${color}`}>{tile === "head" ? "V" : tile === "logo" ? "VIBE" : null}</span>;
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
      <div className="relative grid grid-cols-7 gap-1 rounded-2xl border border-white/10 bg-slate-950/55 p-3 shadow-2xl sm:gap-1.5 sm:p-4">
        {Array.from({ length: 49 }, (_, index) => {
          const color = stackTiles.get(index);
          return (
            <span key={index} className={`grid aspect-square size-5 place-items-center rounded-[5px] text-[7px] font-black text-slate-950 sm:size-7 sm:rounded-md sm:text-[9px] ${color ?? "bg-white/[0.035]"}`}>
              {color ? "V" : null}
            </span>
          );
        })}
      </div>
      <span className="absolute bottom-3 right-4 text-[10px] font-black tracking-[0.2em] text-fuchsia-100/70">MAKE ROOM. STACK VIBE.</span>
    </div>
  );
}

export default function GameArtwork({ game }: { game: VibeGame }) {
  return (
    <div aria-hidden="true" className="aspect-[1.55] w-full">
      {game === "reflex" ? <ReflexArtwork /> : game === "trail" ? <TrailArtwork /> : <StackArtwork />}
    </div>
  );
}
