"use client";

import { Gem, MapPinned, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import useVibeLanguage from "@/app/components/useVibeLanguage";

const edgeSparkles = [
  { className: "-left-3 top-4", size: 21, delay: 0 },
  { className: "-right-3 top-8", size: 28, delay: 0.18 },
  { className: "-left-2 bottom-7", size: 17, delay: 0.36 },
  { className: "right-1 -bottom-3", size: 25, delay: 0.52 },
  { className: "left-[24%] -top-3", size: 16, delay: 0.72 },
  { className: "right-[26%] -top-4", size: 20, delay: 0.9 },
  { className: "left-[38%] -bottom-3", size: 14, delay: 0.66 },
];

export default function SecretFoundMap() {
  const language = useVibeLanguage();
  const reduceMotion = useReducedMotion();
  const de = language === "de";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mb-8 max-w-xs"
    >
      {edgeSparkles.map((sparkle) => (
        <motion.span
          key={sparkle.className}
          aria-hidden="true"
          animate={reduceMotion ? undefined : { opacity: [0, 1, 0.15, 1, 0], scale: [0.45, 1.45, 0.7, 1.2, 0.45], rotate: [0, 35, -20, 10, 0] }}
          transition={{ delay: sparkle.delay, duration: 1.15, repeat: Infinity, repeatDelay: 0.25, ease: "easeInOut" }}
          className={`pointer-events-none absolute z-20 text-amber-200 drop-shadow-[0_0_9px_rgba(255,220,120,0.95)] ${sparkle.className}`}
        >
          <Sparkles size={sparkle.size} fill="currentColor" />
        </motion.span>
      ))}
      <motion.div
        initial={reduceMotion ? false : { rotate: -7, scale: 0.82 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.14, type: "spring", stiffness: 190, damping: 15 }}
        className="relative z-10 overflow-hidden rounded-2xl border border-amber-100 bg-linear-to-br from-amber-200 via-orange-100 to-amber-300 px-5 py-5 text-amber-950 shadow-xl shadow-amber-950/40"
      >
        <motion.span
          aria-hidden="true"
          animate={reduceMotion ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -4, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-5 top-4 text-amber-700/80"
        ><Sparkles size={19} /></motion.span>
        <motion.span
          aria-hidden="true"
          animate={reduceMotion ? undefined : { opacity: [0.2, 0.85, 0.2], scale: [0.8, 1.12, 0.8] }}
          transition={{ delay: 0.8, duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 left-5 text-amber-700/70"
        ><Sparkles size={14} /></motion.span>
        <span aria-hidden="true" className="absolute -left-5 top-5 text-amber-800/20"><MapPinned size={112} strokeWidth={1.15} /></span>
        <span aria-hidden="true" className="absolute -right-3 bottom-2 text-amber-800/20"><MapPinned size={82} strokeWidth={1.15} /></span>
        <motion.span
          aria-hidden="true"
          animate={reduceMotion ? undefined : { rotate: [0, 360] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="absolute left-5 top-4 grid size-7 place-items-center rounded-full border border-amber-800/30 text-[10px] font-black text-amber-800/70"
        >N</motion.span>
        <motion.span
          animate={reduceMotion ? undefined : { rotate: [0, 10, -8, 0], scale: [1, 1.12, 1] }}
          transition={{ delay: 0.55, duration: 1.8, repeat: Infinity, repeatDelay: 2.4 }}
          className="relative mx-auto grid size-12 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-950/30"
        >
          <Gem size={24} fill="currentColor" aria-hidden="true" />
        </motion.span>
        <p className="relative mt-3 flex items-center justify-center gap-1.5 text-xs font-black tracking-[0.2em]"><Sparkles size={14} aria-hidden="true" /> {de ? "GEHEIMNIS GEFUNDEN" : "SECRET FOUND"}</p>
        <p className="relative mt-1 text-xs font-semibold text-amber-900/75">{de ? "Die Karte zeigt dir den Weg ins Spieleversteck." : "The map points to the hidden games hideout."}</p>
      </motion.div>
    </motion.div>
  );
}
