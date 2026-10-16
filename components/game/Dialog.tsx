"use client";

import { useCallback, useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";

export type DialogScript = { lines: string[]; onDone: () => void };

// Klassisk dialogboks: tekst skrives ud, A/tryk springer frem eller går videre.
export default function Dialog({ script }: { script: DialogScript }) {
  const [line, setLine] = useState(0);
  const [count, setCount] = useState(0);
  const text = script.lines[line] ?? "";
  const done = count >= text.length;

  useEffect(() => {
    setCount(0);
    const id = setInterval(() => {
      setCount((n) => {
        if (n >= text.length) {
          clearInterval(id);
          return n;
        }
        if (n % 3 === 0) sfx.text();
        return n + 1;
      });
    }, 28);
    return () => clearInterval(id);
  }, [text]);

  const advance = useCallback(() => {
    if (!done) return setCount(text.length);
    if (line < script.lines.length - 1) setLine((l) => l + 1);
    else script.onDone();
  }, [done, line, script, text.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "x") {
        e.preventDefault();
        advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  return (
    <button
      type="button"
      onClick={advance}
      className="zelda-box absolute inset-x-2 bottom-2 z-20 font-readable min-h-[5.2rem] px-3 py-2 text-left text-[1.2rem] leading-[1.15] sm:inset-x-4 sm:text-[1.45rem]"
    >
      {text.slice(0, count)}
      {done && (
        <span className="absolute right-2 bottom-1 animate-[blink_0.6s_steps(2,start)_infinite] text-[#f8d848]">▼</span>
      )}
    </button>
  );
}
