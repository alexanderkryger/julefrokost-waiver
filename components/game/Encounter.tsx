"use client";

import { useCallback, useEffect, useState } from "react";
import type { Character } from "@/lib/characters";
import { casperHedegaard } from "@/lib/npcs";
import { sfx } from "@/lib/sfx";
import { PixelSprite } from "../PixelArt";

const LINES = [
  "A wild CASPER HEDEGAARD appeared!",
  "CASPER HEDEGAARD bruger DANS! Det er super effektivt!",
];

// Kamp-intro i klassisk lommemonster-stil, når man træder ind på diskoteket.
export default function Encounter({
  hero,
  onDone,
}: {
  hero: Character;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"flash" | "battle">("flash");
  const [line, setLine] = useState(0);
  const [count, setCount] = useState(0);
  const text = LINES[line];
  const typed = count >= text.length;

  useEffect(() => {
    sfx.encounter();
    const id = setTimeout(() => setPhase("battle"), 1100);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (phase !== "battle") return;
    setCount(0);
    const id = setInterval(
      () => setCount((n) => (n >= text.length ? n : n + 1)),
      35,
    );
    return () => clearInterval(id);
  }, [phase, text]);

  const advance = useCallback(() => {
    if (phase !== "battle") return;
    if (!typed) return setCount(text.length);
    if (line < LINES.length - 1) setLine((l) => l + 1);
    else onDone();
  }, [line, onDone, phase, text.length, typed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "x") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  if (phase === "flash")
    return (
      <div className="absolute inset-0 z-30 animate-[encounter-flash_1.1s_steps(1)_both]" />
    );

  return (
    <button
      type="button"
      onClick={advance}
      className="absolute inset-0 z-30 flex flex-col bg-[#f8f8f0] text-left text-[#202020]"
    >
      <div className="relative flex-1">
        {/* modstanderens statusboks */}
        <div className="absolute top-[6%] left-[4%] w-[52%] border-b-4 border-l-4 border-[#202020] px-2 pt-1 pb-2">
          <p className="text-[0.45rem] leading-relaxed sm:text-[0.6rem]">
            CASPER HEDEGAARD
          </p>
          <p className="text-right text-[0.45rem] sm:text-[0.55rem]">Lv99</p>
          <div className="mt-1 flex items-center gap-1 text-[0.4rem] sm:text-[0.5rem]">
            <span className="text-[#f8a000]">HP</span>
            <span className="h-2 flex-1 rounded-full border-2 border-[#202020] bg-[#30c040]" />
          </div>
        </div>
        {/* modstanderen glider ind fra venstre */}
        <div className="absolute top-[10%] right-[6%] flex flex-col items-center animate-[slide-in-left_0.7s_ease-out_both]">
          <PixelSprite
            character={casperHedegaard}
            scale={4}
            className="animate-[bob_0.5s_steps(2)_infinite]"
          />
          <span className="-mt-3 h-5 w-28 rounded-[50%] bg-[#a8d088]" />
        </div>
        {/* helten set "bagfra" glider ind fra højre */}
        <div className="absolute bottom-[4%] left-[6%] flex flex-col items-center animate-[slide-in-right_0.7s_ease-out_both]">
          <PixelSprite character={hero} scale={5} />
          <span className="-mt-3 h-5 w-32 rounded-[50%] bg-[#a8d088]" />
        </div>
      </div>
      <div className="m-1.5 min-h-[4.5rem] rounded-md border-4 border-double border-[#304878] bg-[#f8f8f8] px-3 py-2 text-[0.55rem] leading-[1.9] sm:text-xs">
        {text.slice(0, count)}
        {typed && (
          <span className="ml-1 animate-[blink_0.6s_steps(2,start)_infinite] text-[#d03030]">
            ▼
          </span>
        )}
      </div>
    </button>
  );
}
