"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

// Minispil: tryk hurtigt for at bunde øllen, før den "fyldes op" igen.
export default function Chug({ onDone }: { onDone: () => void }) {
  const [level, setLevel] = useState(100);
  const [finished, setFinished] = useState(false);
  const finishedRef = useRef(false);

  const sip = useCallback(() => {
    if (finishedRef.current) return;
    sfx.gulp();
    setLevel((l) => Math.max(0, l - 6));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!finishedRef.current) setLevel((l) => (l > 0 ? Math.min(100, l + 0.8) : l));
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (level <= 0 && !finishedRef.current) {
      finishedRef.current = true;
      setFinished(true);
      setTimeout(() => sfx.burp(), 250);
      setTimeout(onDone, 1600);
    }
  }, [level, onDone]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "x") {
        e.preventDefault();
        sip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sip]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75 p-3 text-center">
      <p className="text-xs text-[#f8d848] sm:text-sm">{finished ? "DU BUNDEDE ØLLEN!" : "BUND ØLLEN!"}</p>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          sip();
        }}
        aria-label="Tag en tår"
        className={`relative h-28 w-20 touch-none select-none ${finished ? "" : "active:scale-95"}`}
      >
        {/* Glas */}
        <span className="absolute inset-x-0 top-0 bottom-0 border-4 border-[#f8f8f8] bg-[#f8f8f8]/10" />
        {/* Hank */}
        <span className="absolute top-5 -right-5 h-12 w-5 border-4 border-l-0 border-[#f8f8f8]" />
        {/* Øl */}
        <span
          className="absolute inset-x-1 bottom-1 bg-[#f8b828] transition-[height] duration-100"
          style={{ height: `calc(${level}% - 8px)` }}
        >
          {level > 4 && <span className="absolute inset-x-0 -top-2 h-3 bg-[#f8f8f8]" />}
        </span>
      </button>
      <p className="font-readable text-xl leading-tight text-[#c8c8c8] sm:text-2xl">
        {finished ? "Værdighed −10 · Mod +100" : "Tryk på glasset så hurtigt du kan!"}
      </p>
    </div>
  );
}
