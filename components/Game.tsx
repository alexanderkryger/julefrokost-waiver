"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { characters, type Character } from "@/lib/characters";
import { sfx } from "@/lib/sfx";
import Complete from "./game/Complete";
import Cutscene from "./game/Cutscene";
import Waiver, { type Receipt } from "./game/Waiver";
import World from "./game/World";
import { Hearts, MagicMeter, PixelSprite, Triforce } from "./PixelArt";

type Stage = "title" | "select" | "chosen" | "gameover" | "intro" | "world" | "waiver" | "complete";

const COLS = 3;
const LAST = characters.length - 1;

// Piletaster i gitteret, hvor sidste række kun har én (centreret) helt.
function moveIndex(i: number, key: string) {
  const lastRowStart = Math.floor(LAST / COLS) * COLS;
  const lone = LAST === lastRowStart; // sidste helt står alene i midten
  switch (key) {
    case "ArrowLeft":
      return i % COLS === 0 || i === LAST ? i : i - 1;
    case "ArrowRight":
      return i % COLS === COLS - 1 || i === LAST ? i : Math.min(LAST, i + 1);
    case "ArrowUp":
      if (lone && i === LAST) return lastRowStart - COLS + 1;
      return i - COLS >= 0 ? i - COLS : i;
    case "ArrowDown":
      if (lone && i >= lastRowStart - COLS && i < lastRowStart) return LAST;
      return i + COLS <= LAST ? i + COLS : i;
  }
  return i;
}

export default function Game() {
  const [stage, setStage] = useState<Stage>("title");
  const [index, setIndex] = useState(0);
  const [character, setCharacter] = useState<Character | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [playTime, setPlayTime] = useState(0);
  const startedAt = useRef(0);

  const go = useCallback((s: Stage) => {
    setStage(s);
    window.scrollTo({ top: 0 });
  }, []);

  const start = useCallback(() => {
    sfx.start();
    go("select");
  }, [go]);

  const choose = useCallback(
    (c: Character) => {
      setCharacter(c);
      if (c.gameOver) {
        sfx.gameOver();
        go("gameover");
        return;
      }
      sfx.select();
      go("chosen");
      setTimeout(() => {
        startedAt.current = Date.now();
        go("intro");
      }, 1800);
    },
    [go]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((stage === "title" || stage === "gameover") && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        if (stage === "title") start();
        else go("select");
      } else if (stage === "select") {
        if (e.key.startsWith("Arrow")) {
          e.preventDefault();
          setIndex((i) => {
            const next = moveIndex(i, e.key);
            if (next !== i) sfx.move();
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
  }, [stage, index, start, choose, go]);

  return (
    <Screen wide={stage === "waiver" || stage === "world"}>
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
      {stage === "gameover" && character && <GameOverScreen character={character} onRetry={() => go("select")} />}
      {stage === "intro" && <Cutscene onDone={() => go("world")} />}
      {(stage === "world" || stage === "waiver") && character && (
        <World character={character} paused={stage === "waiver"} onWaiver={() => setStage("waiver")} />
      )}
      {stage === "waiver" && character && (
        <Waiver
          character={character}
          onSigned={(r) => {
            setReceipt(r);
            setPlayTime(Date.now() - startedAt.current);
            go("complete");
          }}
        />
      )}
      {stage === "complete" && character && receipt && (
        <Complete
          character={character}
          receipt={receipt}
          playTime={playTime}
          onRestart={() => {
            setReceipt(null);
            go("title");
          }}
        />
      )}
    </Screen>
  );
}

function Screen({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="retro-screen font-pixel relative min-h-dvh overflow-hidden bg-black text-[#f8f8f8]">
      <div className={`relative z-10 mx-auto flex min-h-dvh w-full flex-col px-4 py-6 ${wide ? "max-w-xl lg:max-w-4xl" : "max-w-xl"}`}>
        {children}
      </div>
    </div>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <>
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
    </>
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
  const lone = LAST % COLS === 0;

  return (
    <>
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
              className={`zelda-tile relative flex flex-col items-center gap-1 px-1 pt-2 pb-2 ${active ? "is-active" : ""} ${lone && i === LAST ? "col-start-2" : ""}`}
            >
              {active && (
                <span className="absolute top-1 left-1.5 animate-[blink_0.6s_steps(2,start)_infinite] text-[0.6rem] text-[#f8d848]">
                  ▶
                </span>
              )}
              <PixelSprite character={c} scale={3} className={active ? "animate-[bob_0.5s_steps(2,end)_infinite]" : ""} />
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
        <p className="font-readable mt-4 min-h-[4.2em] border-t-2 border-dashed border-[#5878c8]/60 pt-3 text-[1.25rem] leading-[1.15] sm:text-[1.45rem]">
          <span className="text-[#c8c8c8]">EGENSKAB: </span>
          {typed}
          <span className="animate-[blink_0.6s_steps(2,start)_infinite]">▌</span>
        </p>
      </div>

      <button type="button" onClick={() => onChoose(current)} className="zelda-button mt-5 py-4 text-xs tracking-[0.2em] sm:text-sm">
        VÆLG {current.name.toUpperCase()} ▶
      </button>
      <p className="mt-3 text-center text-[0.5rem] text-[#888] sm:text-[0.6rem]">
        Tryk på en helt for at se egenskaber · tryk igen for at vælge
      </p>
    </>
  );
}

function ChosenScreen({ character }: { character: Character }) {
  return (
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
        <p className="mt-2 text-[0.6rem] text-[#c8c8c8] sm:text-xs">Eventyret begynder...</p>
      </div>
    </div>
  );
}

function GameOverScreen({ character, onRetry }: { character: Character; onRetry: () => void }) {
  return (
    <div className="gameover flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <PixelSprite character={character} scale={6} className="animate-[faint_1.6s_steps(8,end)_forwards]" />
      <h1 className="animate-[drop-in_0.8s_1.4s_ease-out_both] text-3xl text-[#f8f8f8] [text-shadow:4px_4px_0_#a01818] sm:text-5xl">
        GAME OVER
      </h1>
      <div className="zelda-box animate-[drop-in_0.6s_2.2s_ease-out_both] px-5 py-4 text-[0.6rem] leading-[2] sm:text-xs">
        <p>Du valgte {character.name}.</p>
        <p className="font-readable mt-1 text-xl text-[#c8c8c8]">Det gør man ikke.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="zelda-button animate-[drop-in_0.6s_2.8s_ease-out_both] px-6 py-4 text-xs tracking-[0.2em] sm:text-sm"
      >
        ▶ PRØV IGEN
      </button>
    </div>
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
