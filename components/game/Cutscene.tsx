"use client";

import { useEffect, useRef, useState } from "react";
import { canvasOf, hash } from "@/lib/pixels";

export const W = 256;
export const H = 224;
const GROUND = 168;
const RUNWAY_Y = 200; // hjulenes underkant
const DURATION = 21;

const CAPTIONS: [number, string][] = [
  [0, "Kl. 05:45. Partybussen er på vej mod lufthavnen..."],
  [4.6, "Alle er ombord. Ingen ved, hvor flyet skal hen."],
  [10, "DESTINATION: ██████████"],
  [13, "Kaptajnen beder venligst om, at man ikke synger med i højtaleren."],
  [15.5, "Landet. Et sted. Det er nat, og der dufter af øl."],
];

// ---------- Sprites ----------
function makePlane() {
  return canvasOf(108, 38, (c) => {
    const r = (x: number, y: number, w: number, h: number, col: string) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    };
    // halefinne
    for (let i = 0; i < 13; i++) r(6 + Math.floor(i * 0.6), i, 12 - Math.floor(i * 0.3), 1, "#e8e8f0");
    r(5, 0, 1, 13, "#181820");
    r(9, 3, 3, 1, "#d03030");
    r(11, 4, 1, 2, "#d03030");
    r(10, 6, 1, 1, "#d03030");
    r(10, 8, 1, 1, "#d03030"); // "?" på halen
    // krop
    r(4, 12, 92, 1, "#181820");
    r(4, 13, 94, 12, "#f0f0f8");
    r(4, 25, 92, 1, "#181820");
    r(4, 22, 94, 3, "#c8c8d8");
    r(3, 13, 1, 12, "#181820");
    // næse
    r(98, 14, 3, 10, "#f0f0f8");
    r(101, 16, 2, 7, "#f0f0f8");
    r(103, 18, 1, 4, "#181820");
    r(96, 15, 5, 3, "#283868"); // cockpit
    // stribe + vinduer
    r(4, 20, 99, 2, "#d03030");
    for (let x = 18; x < 92; x += 6) r(x, 15, 3, 3, "#283868");
    // vinge + motor
    r(40, 23, 30, 4, "#9898a8");
    r(48, 27, 14, 5, "#b8b8c8");
    r(48, 31, 14, 1, "#181820");
    // hjul
    r(28, 26, 2, 6, "#484850");
    r(82, 26, 2, 6, "#484850");
    for (const x of [26, 80]) {
      r(x, 32, 6, 5, "#181820");
      r(x + 2, 33, 2, 2, "#888890");
    }
  });
}

function makeBus() {
  return canvasOf(50, 26, (c) => {
    const r = (x: number, y: number, w: number, h: number, col: string) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    };
    r(2, 3, 46, 1, "#181010");
    r(1, 4, 48, 16, "#181010");
    r(2, 4, 46, 15, "#f0c030");
    r(2, 4, 46, 2, "#f8e070");
    for (let x = 5; x < 38; x += 8) r(x, 7, 6, 5, "#80c0f0");
    r(40, 7, 6, 6, "#a8d8f8");
    r(2, 14, 46, 2, "#d03030");
    r(46, 15, 2, 2, "#f8f8c0");
    for (const x of [9, 35]) {
      r(x, 18, 8, 8, "#181010");
      r(x + 3, 21, 2, 2, "#a0a0a0");
    }
  });
}

function makeCloud(w: number) {
  return canvasOf(w, 16, (c) => {
    c.fillStyle = "#f8f8f8";
    c.fillRect(4, 8, w - 8, 6);
    c.fillRect(w * 0.2, 3, w * 0.35, 8);
    c.fillRect(w * 0.45, 0, w * 0.3, 10);
    c.fillStyle = "#d0e0f0";
    c.fillRect(4, 13, w - 8, 2);
  });
}

// ---------- Tegnehjælpere ----------
function bands(ctx: CanvasRenderingContext2D, colors: string[], height: number) {
  const h = Math.ceil(height / colors.length);
  colors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, i * h, W, h);
    // dithering i overgangen
    if (i > 0) {
      ctx.fillStyle = colors[i - 1];
      for (let x = 0; x < W; x += 2) ctx.fillRect(x + (i % 2), i * h, 1, 1);
    }
  });
}

function drawRunway(ctx: CanvasRenderingContext2D, grass: string, tarmac: string, offset = 0) {
  ctx.fillStyle = grass;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = tarmac;
  ctx.fillRect(0, 184, W, 22);
  ctx.fillStyle = "#e8e8e8";
  for (let x = -((offset % 32) + 32) % 32; x < W; x += 32) ctx.fillRect(x, 194, 14, 2);
}

// Tegn flyet med pixeleret "næse op"-hældning (søjle-forskydning i stedet for rotation)
function drawPlane(ctx: CanvasRenderingContext2D, plane: HTMLCanvasElement, x: number, y: number, slope = 0) {
  const bottom = y - plane.height;
  for (let sx = 0; sx < plane.width; sx += 2) {
    const dy = Math.round(((sx - plane.width / 2) * slope) / 2) * 2;
    ctx.drawImage(plane, sx, 0, 2, plane.height, Math.round(x + sx), Math.round(bottom - dy), 2, plane.height);
  }
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export default function Cutscene({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [caption, setCaption] = useState(CAPTIONS[0][1]);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const plane = makePlane();
    const bus = makeBus();
    const clouds = [makeCloud(48), makeCloud(32), makeCloud(64)];
    const skyline = Array.from({ length: 18 }, (_, i) => ({
      x: i * 15,
      w: 12 + Math.floor(hash(i, 1) * 6),
      h: 18 + Math.floor(hash(i, 2) * 40),
    }));

    let raf = 0;
    let finished = false;
    const start = performance.now();

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const cap = [...CAPTIONS].reverse().find(([at]) => t >= at);
      if (cap) setCaption((prev) => (prev === cap[1] ? prev : cap[1]));

      if (t < 10) {
        // --- Daggry i lufthavnen ---
        bands(ctx, ["#2a2050", "#4a3070", "#7a4080", "#c06078", "#f09868", "#f8c080"], GROUND);
        ctx.fillStyle = "#f8e0a0";
        ctx.fillRect(196, 120, 22, 22); // solopgang
        ctx.fillStyle = "#3a2848";
        for (let x = 0; x < W; x++) {
          const hh = 18 + 8 * Math.sin(x / 23) + 5 * Math.sin(x / 7 + 1);
          ctx.fillRect(x, GROUND - hh, 1, hh);
        }
        // terminal
        ctx.fillStyle = "#504060";
        ctx.fillRect(8, 128, 60, 40);
        ctx.fillRect(56, 104, 10, 64);
        ctx.fillStyle = "#88c8f0";
        ctx.fillRect(54, 100, 14, 8);
        ctx.fillStyle = "#f8e070";
        for (let x = 12; x < 52; x += 8) ctx.fillRect(x, 136, 4, 3);
        drawRunway(ctx, "#3a6a3a", "#585868");

        // fly
        let px = 132;
        let py = RUNWAY_Y;
        let slope = 0;
        if (t > 6) {
          const k = t - 6;
          px = 132 + 14 * k * k;
          if (k > 1.6) {
            const lift = k - 1.6;
            py = RUNWAY_Y - 34 * lift * lift;
            slope = Math.min(0.35, lift * 0.4);
          }
        }
        drawPlane(ctx, plane, px, py, slope);

        // bus
        if (t < 6) {
          const bx = -60 + 150 * ease(t / 4.2);
          ctx.globalAlpha = t > 4.6 ? Math.max(0, 1 - (t - 4.6) / 1) : 1;
          ctx.drawImage(bus, Math.round(bx), RUNWAY_Y - bus.height + 1 + (Math.floor(t * 8) % 2));
          ctx.globalAlpha = 1;
        }
      } else if (t < 15) {
        // --- I luften ---
        bands(ctx, ["#2850b0", "#3868c8", "#5088d8", "#70a8e8", "#98c8f0", "#c0e0f8"], H);
        const k = t - 10;
        clouds.forEach((c, i) => {
          for (let n = 0; n < 3; n++) {
            const speed = 30 + i * 40;
            const x = ((n * 140 + i * 50 - k * speed) % 360) + 360;
            ctx.drawImage(c, Math.round((x % 360) - 80), 30 + i * 55 + n * 12);
          }
        });
        drawPlane(ctx, plane, 74, 120 + Math.round(Math.sin(k * 2) * 4), 0);
        // fartstriber
        ctx.fillStyle = "#f8f8f8";
        for (let i = 0; i < 6; i++) {
          const x = (W - ((k * 220 + i * 61) % (W + 40))) | 0;
          ctx.fillRect(x, 20 + i * 34, 18, 1);
        }
      } else {
        // --- Natlig landing på Destinationen ---
        bands(ctx, ["#060614", "#0c0c24", "#121238", "#1a1a4c", "#24205c"], GROUND);
        for (let i = 0; i < 40; i++) {
          if (hash(i, Math.floor(t * 3)) > 0.9) continue;
          ctx.fillStyle = "#f8f8f8";
          ctx.fillRect(Math.floor(hash(i, 7) * W), Math.floor(hash(i, 8) * 110), 1, 1);
        }
        skyline.forEach((b, i) => {
          ctx.fillStyle = "#0a0a1a";
          ctx.fillRect(b.x, GROUND - b.h, b.w, b.h);
          for (let wy = GROUND - b.h + 4; wy < GROUND - 4; wy += 6)
            for (let wx = b.x + 2; wx < b.x + b.w - 2; wx += 4)
              if (hash(wx, wy, i) > 0.55) {
                ctx.fillStyle = ["#f8d860", "#f060c0", "#40e0f0"][Math.floor(hash(wx, wy) * 3)];
                ctx.fillRect(wx, wy, 2, 2);
              }
        });
        // neonskilt
        if (Math.floor(t * 4) % 5) {
          ctx.fillStyle = "#f040b0";
          ctx.fillRect(150, 112, 26, 10);
          ctx.fillStyle = "#0a0a1a";
          ctx.fillRect(152, 114, 22, 6);
          ctx.fillStyle = "#f8a0e0";
          ctx.fillRect(156, 116, 14, 2);
        }
        const k = t - 15;
        const descend = ease(k / 3.2);
        const roll = ease(Math.max(0, k - 3.2) / 2.3);
        const px = -110 + 180 * descend + 20 * roll;
        const py = 70 + (RUNWAY_Y - 70) * descend;
        drawRunway(ctx, "#1a2a24", "#303040", k < 3.2 ? k * 60 : 190 + roll * 20);
        drawPlane(ctx, plane, px, py, 0);
        // landingslys
        ctx.fillStyle = Math.floor(t * 6) % 2 ? "#f83030" : "#30f860";
        ctx.fillRect(Math.round(px + 50), Math.round(py - 6), 2, 2);
      }

      if (t >= DURATION && !finished) {
        finished = true;
        doneRef.current();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative my-auto">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="pixel-canvas block w-full border-4 border-[#f8f8f8] shadow-[0_0_0_3px_#283890]"
      />
      <div className="zelda-box font-readable mt-5 min-h-[4.6rem] px-3 py-2 text-[1.2rem] leading-[1.15] sm:text-[1.45rem]">{caption}</div>
      <button
        type="button"
        onClick={() => doneRef.current()}
        className="absolute top-3 right-3 bg-black/60 px-2 py-1 text-[0.5rem] text-[#f8f8f8] sm:text-[0.6rem]"
      >
        SPRING OVER ▶▶
      </button>
    </div>
  );
}
