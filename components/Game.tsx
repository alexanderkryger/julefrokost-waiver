"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { characters, type Character } from "@/lib/characters";
import { sfx } from "@/lib/sfx";
import { Hearts, MagicMeter, PixelSprite, Triforce } from "./PixelArt";

type Stage = "title" | "select" | "chosen" | "waiver";

const CharacterContext = createContext<{ character: Character | null; changeCharacter: () => void }>({
  character: null,
  changeCharacter: () => {},
});

export const useCharacter = () => useContext(CharacterContext);

const COLS = 3;

export default function Game({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("title");
  const [index, setIndex] = useState(0);
  const [character, setCharacter] = useState<Character | null>(null);

  const start = useCallback(() => {
    sfx.start();
    setStage("select");
  }, []);

  const choose = useCallback((c: Character) => {
    sfx.select();
    setCharacter(c);
    setStage("chosen");
    setTimeout(() => {
      setStage("waiver");
      window.scrollTo({ top: 0 });
    }, 1800);
  }, []);

  const changeCharacter = useCallback(() => {
    setStage("select");
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (stage === "title" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        start();
      } else if (stage === "select") {
        const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS };
        if (e.key in moves) {
          e.preventDefault();
          setIndex((i) => {
            const next = i + moves[e.key];
            if (next < 0 || next >= characters.length) return i;
            sfx.move();
            return next;
          });
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choose(characters[index]);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, index, start, choose]);

  return (
    <CharacterContext.Provider value={{ character, changeCharacter }}>
      {stage === "title" && <TitleScreen onStart={start} />}
      {stage === "select" && (
        <SelectScreen
          index={index}
          onHighlight={(i) => {
            if (i !== index) sfx.move();
            setIndex(i);
          }}
          onChoose={choose}
        />
      )}
      {stage === "chosen" && character && <ChosenScreen character={character} />}
      {stage === "waiver" && children}
    </CharacterContext.Provider>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="retro-screen font-pixel relative min-h-dvh overflow-hidden bg-black text-[#f8f8f8]">
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8">{children}</div>
    </div>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <Screen>
      <button
        type="button"
        onClick={onStart}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-6 text-center"
      >
        <div className="animate-[tf-glow_3s_ease-in-out_infinite]">
          <Triforce size={120} />
        </div>
        <div>
          <p className="text-[0.65rem] tracking-[0.3em] text-[#c8c8c8] sm:text-xs">THE LEGEND OF</p>
          <h1 className="title-logo mt-3 text-[1.6rem] leading-tight sm:text-5xl">JULEFROKOST</h1>
          <p className="mt-4 inline-block bg-[#a01818] px-3 py-2 text-[0.6rem] tracking-[0.2em] text-[#f8e8a0] sm:text-sm">
            A DRINK TO THE PAST
          </p>
        </div>
        <p className="mt-10 animate-[blink_1.1s_steps(2,start)_infinite] text-sm tracking-[0.25em] text-[#f8f8f8] sm:text-base">
          TRYK START
        </p>
      </button>
      <p className="text-center text-[0.55rem] leading-relaxed tracking-widest text-[#888]">
        © 2026 ARRANGØRERNE · DESTINATION: ??????
      </p>
    </Screen>
  );
}

function SelectScreen({
  index,
  onHighlight,
  onChoose,
}: {
  index: number;
  onHighlight: (i: number) => void;
  onChoose: (c: Character) => void;
}) {
  const current = characters[index];
  const typed = useTypewriter(current.ability);

  return (
    <Screen>
      <div className="zelda-box px-4 py-3 text-center">
        <h1 className="text-sm tracking-[0.2em] text-[#f8d848] sm:text-lg">VÆLG DIN HELT</h1>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {characters.map((c, i) => {
          const active = i === index;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => (active ? onChoose(c) : onHighlight(i))}
              onMouseEnter={() => onHighlight(i)}
              aria-pressed={active}
              className={`zelda-tile relative flex flex-col items-center gap-1 px-1 pt-2 pb-2 ${active ? "is-active" : ""}`}
            >
              {active && (
                <span className="absolute top-1 left-1.5 animate-[blink_0.6s_steps(2,start)_infinite] text-[0.6rem] text-[#f8d848]">
                  ▶
                </span>
              )}
              <PixelSprite
                character={c}
                scale={3}
                className={active ? "animate-[bob_0.5s_steps(2,end)_infinite]" : ""}
              />
              <span className={`text-[0.5rem] sm:text-[0.65rem] ${active ? "text-[#f8d848]" : "text-[#f8f8f8]"}`}>
                {c.name.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="zelda-box mt-5 p-4">
        <div className="flex gap-4">
          <div className="flex shrink-0 items-start justify-center bg-[#0c1a10] p-2 ring-2 ring-[#286830]">
            <PixelSprite character={current} scale={4} className="animate-[bob_0.6s_steps(2,end)_infinite]" />
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-[0.55rem] leading-relaxed sm:text-xs">
            <p className="text-sm text-[#f8d848] sm:text-base">{current.name.toUpperCase()}</p>
            <p className="text-[#88c8f8]">{current.title}</p>
            <div>
              <p className="text-[#e82828]">- UDHOLDENHED -</p>
              <div className="mt-1">
                <Hearts count={current.hearts} size={12} />
              </div>
            </div>
            <div>
              <p className="text-[#30c030]">- CHARME -</p>
              <div className="mt-1">
                <MagicMeter value={current.magic} />
              </div>
            </div>
            <p>
              <span className="text-[#c8c8c8]">ITEM: </span>
              <span className="text-[#f8d848]">{current.item}</span>
            </p>
          </div>
        </div>
        <p className="mt-4 min-h-[5.5em] border-t-2 border-dashed border-[#5878c8]/60 pt-3 text-[0.6rem] leading-[1.9] sm:text-xs">
          <span className="text-[#c8c8c8]">EGENSKAB: </span>
          {typed}
          <span className="animate-[blink_0.6s_steps(2,start)_infinite]">▌</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChoose(current)}
        className="zelda-button mt-5 py-4 text-xs tracking-[0.2em] sm:text-sm"
      >
        VÆLG {current.name.toUpperCase()} ▶
      </button>
      <p className="mt-3 text-center text-[0.5rem] text-[#888] sm:text-[0.6rem]">
        Tryk på en helt for at se egenskaber · tryk igen for at vælge
      </p>
    </Screen>
  );
}

function ChosenScreen({ character }: { character: Character }) {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 animate-[flash_0.3s_steps(2,start)_6] rounded-full bg-[#f8f8f8]/20 blur-xl" />
          <PixelSprite character={character} scale={8} className="animate-[item-get_0.6s_ease-out_both]" />
        </div>
        <div className="zelda-box px-5 py-4 text-xs leading-[2] sm:text-sm">
          <p>
            Du har valgt <span className="text-[#f8d848]">{character.name.toUpperCase()}</span>!
          </p>
          <p className="text-[#88c8f8]">{character.title}</p>
          <p className="mt-2 text-[0.6rem] text-[#c8c8c8] sm:text-xs">Nu skal der underskrives...</p>
        </div>
      </div>
    </Screen>
  );
}

function useTypewriter(text: string, speed = 22) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    const id = setInterval(() => {
      setCount((n) => {
        if (n >= text.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return text.slice(0, count);
}

export function PlayerBanner() {
  const { character, changeCharacter } = useCharacter();
  if (!character) return null;
  return (
    <div className="font-pixel mb-10 flex items-center gap-3 border border-gold/40 bg-ink/60 p-3">
      <PixelSprite character={character} scale={2} className="shrink-0" />
      <div className="min-w-0 flex-1 text-[0.55rem] leading-relaxed sm:text-[0.65rem]">
        <p className="text-gold-dim">SPILLER 1</p>
        <p className="text-gold-light">
          {character.name.toUpperCase()} · {character.title}
        </p>
      </div>
      <button
        type="button"
        onClick={changeCharacter}
        className="shrink-0 border border-gold/40 px-2 py-1.5 text-[0.5rem] text-parchment/70 hover:text-gold sm:text-[0.6rem]"
      >
        SKIFT
      </button>
    </div>
  );
}
