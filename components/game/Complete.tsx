"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";
import { characters, type Character } from "@/lib/characters";
import { sfx } from "@/lib/sfx";
import { PixelSprite, Triforce } from "../PixelArt";
import QuestList from "./QuestList";
import type { Receipt } from "./Waiver";
import { quests } from "@/lib/quests";

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Complete({
  character,
  receipt,
  playTime,
  onRestart,
}: {
  character: Character;
  receipt: Receipt;
  playTime: number;
  onRestart: () => void;
}) {
  useEffect(() => {
    sfx.victory();
    const colors = ["#f8d848", "#f8c830", "#e82828", "#30c030", "#f8f8f8"];
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors, shapes: ["square"] });
    const a = setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors, shapes: ["square"] }), 300);
    const b = setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors, shapes: ["square"] }), 500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const signedAt = new Date(receipt.signedAt).toLocaleString("da-DK", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="animate-[tf-glow_3s_ease-in-out_infinite]">
        <Triforce size={90} />
      </div>
      <div>
        <p className="text-[0.55rem] tracking-[0.3em] text-[#c8c8c8] sm:text-xs">QUEST FULDFØRT</p>
        <h1 className="title-logo mt-3 text-[1.1rem] leading-snug sm:text-3xl">DU HAR GENNEMFØRT!</h1>
      </div>

      <PixelSprite character={character} scale={6} className="animate-[item-get_0.6s_ease-out_both]" />

      <div className="zelda-box w-full px-4 py-4 text-[0.55rem] leading-[2] sm:text-xs">
        <p>
          <span className="text-[#f8d848]">{receipt.name}</span> ({character.title}) er nu bundet til festen.
        </p>
        <p className="text-[#c8c8c8]">Underskrevet {signedAt}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-3 text-left">
          <span className="text-[#88c8f8]">OPGAVER</span>
          <span className="text-right">
            {quests.length}/{quests.length}
          </span>
          <span className="text-[#88c8f8]">VÆRDIGHED</span>
          <span className="text-right">0 %</span>
          <span className="text-[#88c8f8]">TID</span>
          <span className="text-right">{formatTime(playTime)}</span>
          <span className="text-[#88c8f8]">KVITTERING</span>
          <span className="text-right">{receipt.id}</span>
        </div>
      </div>

      <QuestList done={quests.length} className="w-full text-left" />

      <div className="relative w-full max-w-sm border-4 border-[#3a2210] bg-[#fff8e0] p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={receipt.signature} alt={`Underskrift af ${receipt.name}`} className="mx-auto h-24 w-auto" />
        <div className="stamp pointer-events-none absolute right-2 bottom-2 px-2 py-0.5 text-[0.55rem] font-bold">
          BINDENDE
        </div>
      </div>

      <p className="font-readable text-2xl leading-tight text-[#e82828]">
        HVAD DER SKER PÅ DESTINATIONEN, BLIVER PÅ DESTINATIONEN
      </p>

      <div className="zelda-box w-full px-4 py-4">
        <p className="text-[0.6rem] text-[#f8d848] sm:text-xs">- MEDVIRKENDE -</p>
        <ul className="mt-3 space-y-2 text-[0.5rem] leading-relaxed sm:text-[0.65rem]">
          {characters.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span className={c.gameOver ? "text-[#888]" : ""}>{c.name.toUpperCase()}</span>
              <span className={c.gameOver ? "text-[#888]" : "text-[#88c8f8]"}>{c.gameOver ? "(GAME OVER)" : c.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" onClick={onRestart} className="zelda-button w-full py-4 text-xs tracking-[0.2em] sm:text-sm">
        SPIL IGEN
      </button>
      <p className="font-readable text-lg leading-tight text-[#777]">
        Dette dokument har ingen juridisk gyldighed. Det har til gengæld enorm moralsk gyldighed.
      </p>
    </div>
  );
}
