"use client";

import { Gem, MapPinned, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function SecretFoundMap() {
  const language = useVibeLanguage();
  const reduceMotion = useReducedMotion();
  const de = language === "de";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mb-8 max-w-xs"
    >
      <motion.div
        initial={reduceMotion ? false : { rotate: -7, scale: 0.82 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.14, type: "spring", stiffness: 190, damping: 15 }}
        className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-linear-to-br from-amber-200 via-orange-100 to-amber-300 px-5 py-5 text-amber-950 shadow-xl shadow-black/30"
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
