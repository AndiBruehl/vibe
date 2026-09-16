"use client";

import { Gem, MapPinned, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import useVibeLanguage from "@/app/components/useVibeLanguage";

const edgeSparkles = [
  { size: 22, delay: 0 },
  { size: 26, delay: 0.8 },
  { size: 17, delay: 1.35 },
  { size: 20, delay: 2 },
];

const edgePositions = ["-left-3 top-6", "-right-3 top-10", "left-[22%] -top-3", "right-[20%] -bottom-3", "-left-3 bottom-8", "-right-3 bottom-6", "left-[45%] -top-4", "left-[46%] -bottom-4", "-left-2 top-1/2", "-right-2 top-1/2"];

function shuffledEdgePositions() {
  return [...edgePositions].sort(() => Math.random() - 0.5).slice(0, edgeSparkles.length);
}

export default function SecretFoundMap() {
  const language = useVibeLanguage();
  const reduceMotion = useReducedMotion();
  const de = language === "de";
  const [sparklePositions, setSparklePositions] = useState(() => edgePositions.slice(0, edgeSparkles.length));

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => setSparklePositions(shuffledEdgePositions()), 3600);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mb-8 max-w-xs"
    >
      {edgeSparkles.map((sparkle, index) => (
        <span
          key={index}
          aria-hidden="true"
          style={{ animationDelay: `${sparkle.delay}s` }}
          className={`vibe-secret-edge-sparkle pointer-events-none absolute z-20 text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)] transition-all duration-700 ease-in-out ${sparklePositions[index]}`}
        >
          <Sparkles size={sparkle.size} fill="currentColor" />
        </span>
      ))}
      <motion.div
        initial={reduceMotion ? false : { rotate: -7, scale: 0.82 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.14, type: "spring", stiffness: 190, damping: 15 }}
        className="relative z-10 overflow-hidden rounded-2xl border border-amber-100 bg-linear-to-br from-amber-200 via-orange-100 to-amber-300 px-5 py-5 text-amber-950 shadow-xl shadow-amber-950/40"
      >
        <span aria-hidden="true" className="vibe-secret-inner-sparkle absolute right-5 top-4 text-amber-700/80"><Sparkles size={19} /></span>
        <span aria-hidden="true" className="vibe-secret-inner-sparkle vibe-secret-inner-sparkle-delayed absolute bottom-4 left-5 text-amber-700/70"><Sparkles size={14} /></span>
        <span aria-hidden="true" className="absolute -left-5 top-5 text-amber-800/20"><MapPinned size={112} strokeWidth={1.15} /></span>
        <span aria-hidden="true" className="absolute -right-3 bottom-2 text-amber-800/20"><MapPinned size={82} strokeWidth={1.15} /></span>
        <span aria-hidden="true" className="vibe-secret-compass absolute left-5 top-4 grid size-7 place-items-center rounded-full border border-amber-800/30 text-[10px] font-black text-amber-800/70">N</span>
        <span
          className="vibe-secret-gem relative mx-auto grid size-12 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-950/30"
        >
          <Gem size={24} fill="currentColor" aria-hidden="true" />
        </span>
        <p className="relative mt-3 flex items-center justify-center gap-1.5 text-xs font-black tracking-[0.2em]"><Sparkles size={14} aria-hidden="true" /> {de ? "GEHEIMNIS GEFUNDEN" : "SECRET FOUND"}</p>
        <p className="relative mt-1 text-xs font-semibold text-amber-900/75">{de ? "Die Karte zeigt dir den Weg ins Spieleversteck." : "The map points to the hidden games hideout."}</p>
      </motion.div>
    </motion.div>
  );
}
