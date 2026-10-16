"use client";

import { useEffect, useRef, useState } from "react";
import { drawRows, spriteCanvas } from "@/lib/pixels";
import { sfx } from "@/lib/sfx";

// Middag & cocktails: grib mad og drinks med bakken, undgå salaten. Hver cocktail gør dig mere fuld.
const W = 128;
const H = 160;
const GOAL = 6;

const FOOD: { rows: string[]; colors: Record<string, string>; bad?: boolean; drink?: boolean }[] = [
  {
    // kyllingelår
    rows: ["..OOO...", ".OBBBO..", "OBBbBBO.", "OBBBBBO.", ".OBBBO..", "..OWO...", "...OWO..", "....OO.."],
    colors: { O: "#201008", B: "#a0502a", b: "#c87040", W: "#f8f0d8" },
  },
  {
    // burger
    rows: ["..OOOO..", ".OYYYYO.", "OYYYYYYO", "OGGGGGGO", "OBBBBBBO", "ORRRRRRO", ".OYYYYO.", "..OOOO.."],
    colors: { O: "#201008", Y: "#e0a040", G: "#40b030", B: "#6b3a1a", R: "#d03030" },
  },
  {
    // flæskesteg
    rows: ["........", ".OOOOOO.", "OSSSSSSO", "OCCCCCCO", "OMMMMMMO", "OMmMMmMO", ".OOOOOO.", "........"],
    colors: { O: "#201008", S: "#f8e0a0", C: "#c87830", M: "#e8a090", m: "#f8c8b8" },
  },
  {
    // pink cocktail med paraply
    drink: true,
    rows: ["UUU.....", ".UUU....", "OWWWWWWO", ".OPPPPO.", "..OPPO..", "...OO...", "...OO...", "..OOOO.."],
    colors: { O: "#c8d8f0", W: "#f8f8f8", P: "#f040b0", U: "#f8d848" },
  },
  {
    // blå cocktail med citron
    drink: true,
    rows: [".....YY.", "....YYYY", "OWWWWWYO", ".OBBBBO.", "..OBBO..", "...OO...", "...OO...", "..OOOO.."],
    colors: { O: "#c8d8f0", W: "#f8f8f8", B: "#30c0f0", Y: "#f8e848" },
  },
  {
    // salat – bliv væk!
    bad: true,
    rows: ["..G.GG..", ".GGLGGG.", "GGLGGLGG", "GLGGGGLG", "OWWWWWWO", ".OWWWWO.", "..OOOO..", "........"],
    colors: { O: "#201008", G: "#40b030", L: "#90e060", W: "#f8f8f8" },
  },
];

const PLATE = ["..OOOOOOOOOOOO..", ".OWWWWWWWWWWWWO.", "OWWwwwwwwwwwwWWO", ".OWWWWWWWWWWWWO.", "..OOOOOOOOOOOO.."];
const PLATE_COLORS = { O: "#303040", W: "#f8f8f8", w: "#d8d8e0" };

const BAD = FOOD.findIndex((f) => f.bad);
const DRINKS = FOOD.flatMap((f, i) => (f.drink ? [i] : []));
const DISHES = FOOD.flatMap((f, i) => (!f.drink && !f.bad ? [i] : []));
const pick = (xs: number[]) => xs[Math.floor(Math.random() * xs.length)];

export default function Dinner({ onDone, input }: { onDone: () => void; input: () => number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [drinks, setDrinks] = useState(0);
  const plate = useRef({ x: W / 2, pointer: null as number | null, hold: 0 });
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const sprites = FOOD.map((f) => spriteCanvas(f.rows, f.colors));
    const plateImg = spriteCanvas(PLATE, PLATE_COLORS);
    let items: { x: number; y: number; kind: number; vy: number }[] = [];
    let spawn = 0.4;
    let caught = 0;
    let drunk = 0;
    let finished = false;
    let last = performance.now();
    let raf = 0;
    let msgTimer: ReturnType<typeof setTimeout> | undefined;
    const flash = (m: string) => {
      setMsg(m);
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => setMsg(null), 900);
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = plate.current;
      // jo flere cocktails, jo mere sejler bakken
      const dx = inputRef.current() + p.hold + (drunk ? Math.sin(now / 300) * 0.25 * Math.min(drunk, 4) : 0);
      if (p.pointer !== null) p.x += Math.sign(p.pointer - p.x) * Math.min(Math.abs(p.pointer - p.x), 180 * dt);
      else p.x += dx * 110 * dt;
      p.x = Math.max(16, Math.min(W - 16, p.x));

      if (!finished) {
        spawn -= dt;
        if (spawn <= 0) {
          const r = Math.random();
          items.push({
            x: 10 + Math.random() * (W - 20),
            y: -10,
            kind: r < 0.25 ? BAD : r < 0.6 ? pick(DRINKS) : pick(DISHES),
            vy: 38 + caught * 5 + Math.random() * 15,
          });
          spawn = 0.75 + Math.random() * 0.5;
        }
      }
      items.forEach((it) => (it.y += it.vy * dt));
      const plateY = H - 14;
      items = items.filter((it) => {
        if (it.y > plateY - 8 && it.y < plateY + 2 && Math.abs(it.x - p.x) < 18) {
          if (FOOD[it.kind].bad) {
            sfx.yuck();
            caught = Math.max(0, caught - 1);
            flash("SALAT?! −1");
          } else if (FOOD[it.kind].drink) {
            sfx.gulp();
            caught++;
            drunk++;
            setDrinks(drunk);
            flash(["SKÅL!", "PROST!", "BUNDEN!", "CHEERS!"][drunk % 4]);
          } else {
            sfx.catch();
            caught++;
            flash(["Mums!", "Nam!", "Mere!"][caught % 3]);
          }
          setScore(caught);
          if (caught >= GOAL && !finished) {
            finished = true;
            setWon(true);
            sfx.burp();
            setTimeout(() => onDoneRef.current(), 1800);
          }
          return false;
        }
        return it.y < H + 10;
      });

      // tegn
      ctx.fillStyle = "#3a1e14";
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 16)
        for (let x = 0; x < W; x += 16) {
          ctx.fillStyle = (x + y) % 32 ? "#d84040" : "#f8f0e8";
          ctx.fillRect(x, y + 120, 16, 16);
        }
      ctx.fillStyle = "#2a1408";
      ctx.fillRect(0, 118, W, 2);
      // stearinlys
      drawRows(ctx, [".Y.", "YyY", ".W.", ".W.", ".W.", "WWW"], { Y: "#f8b828", y: "#f8f8a0", W: "#f8f8e8" }, 10, 108);
      drawRows(ctx, [".Y.", "YyY", ".W.", ".W.", ".W.", "WWW"], { Y: "#f8b828", y: "#f8f8a0", W: "#f8f8e8" }, W - 13, 108);
      items.forEach((it) => ctx.drawImage(sprites[it.kind], Math.round(it.x - 8), Math.round(it.y - 8), 16, 16));
      ctx.drawImage(plateImg, Math.round(p.x - 16), plateY - 4, 32, 10);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(msgTimer);
    };
  }, []);

  const toCanvasX = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    plate.current.pointer = ((e.clientX - r.left) / r.width) * W;
  };
  const hold = (d: number) => () => {
    plate.current.hold = d;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3">
      <div className="zelda-box w-full max-w-xs px-3 py-3 text-center">
        <p className="text-xs text-[#f8d848] sm:text-sm">{won ? "MÆT OG FULD!" : "MAD & COCKTAILS"}</p>
        <p className="font-readable mt-1 text-lg leading-tight text-[#c8c8c8]">
          Grib {GOAL} retter og cocktails med bakken. Undgå salaten.
        </p>
        <div
          className={`relative mt-2 border-4 border-[#f8f8f8] ${
            drinks >= 3 ? "animate-[sway-hard_3s_ease-in-out_infinite]" : drinks >= 1 ? "animate-[sway_4s_ease-in-out_infinite]" : ""
          }`}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={toCanvasX}
            onPointerMove={(e) => (e.buttons || e.pointerType === "touch") && toCanvasX(e)}
            onPointerUp={() => (plate.current.pointer = null)}
            onPointerLeave={() => (plate.current.pointer = null)}
            className="pixel-canvas block w-full touch-none"
          />
          {msg && (
            <p className="font-readable pointer-events-none absolute inset-x-0 top-2 text-center text-3xl text-[#f8f8f8] [text-shadow:2px_2px_0_#000]">
              {msg}
            </p>
          )}
        </div>
        <p className="font-readable mt-2 text-xl text-[#f8d848]">
          GREBET: {score}/{GOAL} · COCKTAILS: {drinks}
        </p>
        <div className="mt-2 flex justify-between" onPointerUp={hold(0)} onPointerLeave={hold(0)} onPointerCancel={hold(0)}>
          <button type="button" onPointerDown={hold(-1)} aria-label="Venstre" className="dpad-btn h-12 w-20 touch-none">
            ◀
          </button>
          <button type="button" onPointerDown={hold(1)} aria-label="Højre" className="dpad-btn h-12 w-20 touch-none">
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
