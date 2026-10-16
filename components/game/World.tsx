"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { characters, type Character } from "@/lib/characters";
import { pixelFont } from "@/lib/fonts";
import { bouncer, santa } from "@/lib/npcs";
import { canvasOf, drawRows, hash, spriteCanvas } from "@/lib/pixels";
import { sfx } from "@/lib/sfx";
import { buildWalkFrames, palette } from "@/lib/sprites";
import Chug from "./Chug";
import Dialog, { type DialogScript } from "./Dialog";
import { Hearts } from "../PixelArt";

const W = 256;
const H = 224;
const T = 16;
const SPEED = 80; // px/s

type MapId = "arrival" | "disco";
type Rect = { x: number; y: number; w: number; h: number };

// 16×14 fliser. Se TILE_SOLID for hvad man ikke kan gå igennem.
const MAPS: Record<MapId, string[]> = {
  arrival: [
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwddwwwwwww",
    "TgfggggppggggfgT",
    "TggggggppggggggT",
    "TggppppppggggggT",
    "TgpBBggppggfgggT",
    "TggggggppggggggT",
    "TTgfgggppgggggTT",
    "gggggggppggggggg",
    "tttttttttttttttt",
    "tttttttttttttttt",
    "tttttttttttttttt",
    "tttttttttttttttt",
  ],
  disco: [
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "WJJkkkkkkkkkkkRW",
    "WJJkkkkSSkkkkkRW",
    "WkkkkkkkkkkkkkRW",
    "WkkFFFFFFFFFFkRW",
    "WkkFFFFFFFFFFkkW",
    "WkkFFFFFFFFFFkkW",
    "WkkFFFFFFFFFFkkW",
    "WkkFFFFFFFFFFkkW",
    "WkkkkkkkkkkkkkkW",
    "WkkkkkkkkkkkkkkW",
    "WkkkkkkkkkkkkkkW",
    "WWWWWWWddWWWWWWW",
  ],
};
const TILE_SOLID = new Set(["w", "T", "B", "W", "J", "R", "S"]);
const START: Record<MapId, { x: number; y: number }> = {
  arrival: { x: 56, y: 190 },
  disco: { x: 128, y: 200 },
};

const PLANE_RECTS: Rect[] = [
  { x: 150, y: 178, w: 106, h: 22 },
  { x: 186, y: 160, w: 24, h: 64 },
];
const BOUNCER_POS = { x: 154, y: 60 };
const SANTA_POS = { x: 128, y: 46 };
const BEER_STAND: Rect = { x: 48, y: 96, w: 32, h: 16 };
const DANCE_SPOTS = [
  { x: 72, y: 104 },
  { x: 168, y: 100 },
  { x: 112, y: 148 },
  { x: 196, y: 140 },
  { x: 64, y: 150 },
];

const TREE = [
  ".....OOOOOO.....",
  "...OOLLGGGGOO...",
  "..OLLGGGGGGGGO..",
  ".OLGGGGGgGGGGGO.",
  ".OLGGGgGGGGGgGO.",
  "OLGGGGGGGGgGGGGO",
  "OGGgGGGGGGGGGgGO",
  "OGGGGGGgGGGGGGGO",
  "OGGGGGGGGGGgGGgO",
  ".OGgGGGGGGGGGGO.",
  ".OGGGGgGGGGgGGO.",
  "..OOgGGGGGGgOO..",
  "....OOOKKOOO....",
  "......OKKO......",
  ".....OKKKKO.....",
  "......OOOO......",
];
const TREE_COLORS = { O: "#102810", G: "#2c7a2c", g: "#1c5a1c", L: "#58b048", K: "#6b3a1a" };

const hits = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const feetBox = (x: number, y: number): Rect => ({ x: x - 5, y: y - 5, w: 10, h: 6 });
const grow = (r: Rect, n: number): Rect => ({ x: r.x - n, y: r.y - n, w: r.w + n * 2, h: r.h + n * 2 });

// ---------- Baggrunde (tegnes én gang pr. kort) ----------
function drawTile(ctx: CanvasRenderingContext2D, ch: string, tx: number, ty: number) {
  const x = tx * T;
  const y = ty * T;
  const px = (dx: number, dy: number, col: string, w = 1, h = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + dx, y + dy, w, h);
  };
  const grass = () => {
    px(0, 0, "#48983c", T, T);
    for (let i = 0; i < 5; i++) {
      const gx = Math.floor(hash(tx, ty, i) * 14);
      const gy = Math.floor(hash(ty, tx, i) * 14);
      px(gx, gy, "#2c7028");
      px(gx + 2, gy, "#2c7028");
      px(gx + 1, gy - 1, "#2c7028");
    }
  };
  switch (ch) {
    case "g":
      return grass();
    case "f":
      grass();
      for (let i = 0; i < 3; i++) {
        const fx = 2 + Math.floor(hash(tx, ty, i + 9) * 11);
        const fy = 2 + Math.floor(hash(ty, tx, i + 9) * 11);
        px(fx, fy - 1, "#f8f8f8");
        px(fx - 1, fy, "#f8f8f8");
        px(fx + 1, fy, "#f8f8f8");
        px(fx, fy + 1, "#f8f8f8");
        px(fx, fy, i % 2 ? "#f84848" : "#f8d848");
      }
      return;
    case "p":
      px(0, 0, "#c8a870", T, T);
      for (let i = 0; i < 4; i++) px(Math.floor(hash(tx, ty, i) * 14), Math.floor(hash(ty, tx, i) * 14), "#a08050", 2, 1);
      return;
    case "t":
      px(0, 0, "#58586a", T, T);
      for (let i = 0; i < 3; i++) px(Math.floor(hash(tx, ty, i) * 15), Math.floor(hash(ty, tx, i) * 15), "#4a4a5a");
      if (ty === 12 && tx % 2 === 0) px(2, 7, "#e8e8e8", 10, 2);
      return;
    case "T":
      grass();
      drawRows(ctx, TREE, TREE_COLORS, x, y);
      return;
    case "B":
      grass();
      return; // ølstanden tegnes som objekt
    case "w":
      px(0, 0, "#2a1238", T, T);
      for (let r = 0; r < 4; r++) px(0, r * 4 + 3, "#1a0828", T, 1);
      for (let r = 0; r < 4; r++) px(((r % 2) * 8 + 4) % T, r * 4, "#1a0828", 1, 3);
      if (ty === 2) px(0, 15, "#f040b0", T, 1);
      return;
    case "d":
      px(0, 0, "#05030a", T, T);
      px(0, 0, "#f040b0", T, 1);
      if (tx === 7) px(0, 0, "#f040b0", 1, T);
      if (tx === 8) px(15, 0, "#f040b0", 1, T);
      return;
    case "W":
      px(0, 0, "#120a1e", T, T);
      for (let i = 0; i < 2; i++) px(Math.floor(hash(tx, ty, i) * 15), Math.floor(hash(ty, tx, i) * 15), "#20142e");
      if (ty === 1) px(0, 14, "#30e0f0", T, 1);
      if (ty === 13 && (tx === 6 || tx === 9)) px(tx === 6 ? 15 : 0, 0, "#30e0f0", 1, T);
      return;
    case "k":
      px(0, 0, "#1c1230", T, T);
      if ((tx + ty) % 2 === 0) px(7, 7, "#2c1e44", 2, 2);
      return;
    case "F":
      return; // danseguld er animeret
    case "J":
      px(0, 0, "#1c1230", T, T);
      px(0, 2, "#383848", T, 13);
      px(0, 2, "#585868", T, 2);
      if (ty === 2) {
        px(3, 6, "#101010", 8, 8);
        px(6, 9, "#c83030", 2, 2);
      }
      if (ty === 3) for (let i = 0; i < 4; i++) px(2 + i * 3, 7, ["#30e0f0", "#f040b0", "#f8d848", "#30f860"][i], 2, 2);
      return;
    case "R":
      px(0, 0, "#1c1230", T, T);
      px(2, 0, "#6b3a1a", 12, T);
      px(2, 0, "#8b5a2a", 3, T);
      if (ty % 2 === 0) {
        px(8, 2, "#30a050", 2, 5);
        px(11, 4, "#a03030", 2, 4);
      }
      return;
    case "S":
      px(0, 0, "#1c1230", T, T);
      px(0, 3, "#6b3a1a", T, 11);
      px(0, 3, "#8b5a2a", T, 2);
      px(0, 13, "#3a1e0c", T, 1);
      if (tx === 7) {
        px(6, 1, "#e8d8b0", 12, 4); // pergamentrulle
        px(6, 1, "#a08050", 1, 4);
      } else {
        px(8, -2, "#f8f8e8", 2, 5); // stearinlys
        px(8, -4, "#f8b828", 2, 2);
      }
      return;
  }
}

function buildBackground(map: MapId) {
  return canvasOf(W, H, (ctx) => {
    MAPS[map].forEach((row, ty) => row.split("").forEach((ch, tx) => drawTile(ctx, ch, tx, ty)));
    if (map === "arrival") {
      // vinduer i diskotekets facade
      for (const wx of [24, 56, 184, 216]) {
        ctx.fillStyle = "#05030a";
        ctx.fillRect(wx, 30, 16, 12);
        ctx.fillStyle = "#6030a0";
        ctx.fillRect(wx + 1, 31, 14, 10);
      }
      // fly set oppefra
      const r = (x: number, y: number, w: number, h: number, c: string) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, h);
      };
      r(186, 160, 24, 64, "#181820");
      r(187, 161, 22, 62, "#c8c8d8");
      r(150, 180, 104, 18, "#181820");
      r(151, 181, 103, 16, "#f0f0f8");
      r(151, 187, 103, 2, "#d03030");
      r(246, 183, 6, 12, "#283868");
      r(150, 176, 12, 26, "#181820");
      r(151, 177, 10, 24, "#e0e0e8");
      r(176, 162, 8, 10, "#9898a8");
      r(176, 212, 8, 10, "#9898a8");
      // trappe
      r(136, 196, 14, 10, "#787888");
      for (let i = 0; i < 4; i++) r(137, 197 + i * 2, 12, 1, "#a8a8b8");
    }
  });
}

// ---------- Komponent ----------
export default function World({
  character,
  onWaiver,
  paused,
}: {
  character: Character;
  onWaiver: () => void;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<MapId>("arrival");
  const [drunk, setDrunk] = useState(false);
  const [dialog, setDialog] = useState<DialogScript | null>(null);
  const [chugging, setChugging] = useState(false);
  const [fade, setFade] = useState(false);

  const state = useRef({
    map: "arrival" as MapId,
    x: START.arrival.x,
    y: START.arrival.y,
    moving: false,
    target: null as { x: number; y: number } | null,
    keys: new Set<string>(),
    pad: { x: 0, y: 0 },
    busy: false,
    drunk: false,
    cooldown: 0,
  });

  const busy = Boolean(dialog || chugging || fade || paused);
  state.current.busy = busy;
  state.current.drunk = drunk;

  const say = useCallback((lines: string[], onDone?: () => void) => {
    setDialog({
      lines,
      onDone: () => {
        setDialog(null);
        state.current.cooldown = 0.4;
        onDone?.();
      },
    });
  }, []);

  const goTo = useCallback((next: MapId) => {
    sfx.door();
    setFade(true);
    setTimeout(() => {
      const s = state.current;
      s.map = next;
      s.x = START[next].x;
      s.y = START[next].y;
      s.target = null;
      setMap(next);
      setTimeout(() => setFade(false), 250);
    }, 400);
  }, []);

  // Velkomst ved ankomst
  useEffect(() => {
    say([
      `Velkommen til Destinationen, ${character.name}!`,
      "Ingen ved, hvor I er. Men der er øl.",
      "MÅL: Find en øl og bund den. Brug pilene, eller tryk der, hvor du vil gå hen.",
    ]);
  }, [character.name, say]);

  // Hændelser når helten rammer bestemte steder
  const triggers = useRef<(s: typeof state.current) => void>(() => {});
  triggers.current = (s) => {
    const feet = feetBox(s.x, s.y);
    if (s.map === "arrival") {
      if (!s.drunk && hits(feet, grow(BEER_STAND, 4))) {
        s.target = null;
        say(["Du fandt en kold ØL!", "Der er kun én ting at gøre..."], () => setChugging(true));
      } else if (feet.y < 3 * T && feet.x > 7 * T - 4 && feet.x < 9 * T) {
        if (s.drunk) goTo("disco");
        else {
          sfx.denied();
          s.y += 14;
          s.target = null;
          say([
            "DØRMANDEN: Stop der!",
            "Ingen kommer ind på DISKOTEKET uden at have bundet mindst én øl.",
            "Det står i paragrafferne.",
          ]);
        }
      }
    } else if (hits(feet, { x: 104, y: 64, w: 48, h: 10 })) {
      s.target = null;
      say(
        [
          `JULEMANDEN: Ho ho ho, ${character.name}!`,
          "Du har rejst langt for at komme hertil. Hvorhen, ved ingen.",
          "Men før festen kan begynde, skal du underskrive dette pergament.",
          "Læs det grundigt. Eller lad være. Det ændrer intet.",
        ],
        onWaiver
      );
    } else if (feet.y > 13 * T - 4) {
      s.y -= 10;
      say(["Du kan ikke gå nu. Festen er lige begyndt."]);
    }
  };

  // Spil-løkken
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const bgs: Record<MapId, HTMLCanvasElement> = { arrival: buildBackground("arrival"), disco: buildBackground("disco") };
    const frames = buildWalkFrames(character).map((f) => spriteCanvas(f, palette(character)));
    const npcSprite = (c: Character) => buildWalkFrames(c).map((f) => spriteCanvas(f, palette(c)));
    const bouncerImg = npcSprite(bouncer)[0];
    const santaImg = npcSprite(santa)[0];
    const dancers = characters
      .filter((c) => c.id !== character.id && !c.gameOver)
      .slice(0, DANCE_SPOTS.length)
      .map((c, i) => ({ frames: npcSprite(c), ...DANCE_SPOTS[i] }));
    const font = `8px ${pixelFont.style.fontFamily}`;

    const solidAt = (s: typeof state.current, box: Rect) => {
      if (box.x < 0 || box.y < 0 || box.x + box.w > W || box.y + box.h > H) return true;
      const grid = MAPS[s.map];
      for (let ty = Math.floor(box.y / T); ty <= Math.floor((box.y + box.h - 1) / T); ty++)
        for (let tx = Math.floor(box.x / T); tx <= Math.floor((box.x + box.w - 1) / T); tx++)
          if (TILE_SOLID.has(grid[ty]?.[tx] ?? "w")) return true;
      const objects: Rect[] =
        s.map === "arrival"
          ? [...PLANE_RECTS, BEER_STAND, feetBox(BOUNCER_POS.x, BOUNCER_POS.y)]
          : [feetBox(SANTA_POS.x, SANTA_POS.y), ...DANCE_SPOTS.map((d) => feetBox(d.x, d.y))];
      return objects.some((o) => hits(box, o));
    };

    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const s = state.current;

      // --- Bevægelse ---
      let dx = s.pad.x;
      let dy = s.pad.y;
      if (s.keys.has("left")) dx -= 1;
      if (s.keys.has("right")) dx += 1;
      if (s.keys.has("up")) dy -= 1;
      if (s.keys.has("down")) dy += 1;
      if (dx || dy || s.busy) s.target = null;
      else if (s.target) {
        const tx = s.target.x - s.x;
        const ty = s.target.y - s.y;
        const dist = Math.hypot(tx, ty);
        if (dist < 2) s.target = null;
        else {
          dx = tx / dist;
          dy = ty / dist;
        }
      }
      s.cooldown = Math.max(0, s.cooldown - dt);
      s.moving = false;
      if (!s.busy && (dx || dy)) {
        const len = Math.hypot(dx, dy) || 1;
        const step = SPEED * dt;
        const wob = s.drunk ? Math.sin(t * 3) * 0.35 : 0;
        const mx = (dx / len + wob * (dy / len)) * step;
        const my = (dy / len - wob * (dx / len)) * step;
        const before = { x: s.x, y: s.y };
        if (!solidAt(s, feetBox(s.x + mx, s.y))) s.x += mx;
        if (!solidAt(s, feetBox(s.x, s.y + my))) s.y += my;
        s.moving = before.x !== s.x || before.y !== s.y;
        if (!s.moving) s.target = null;
        if (s.cooldown === 0) triggers.current(s);
      }

      // --- Tegning ---
      ctx.drawImage(bgs[s.map], 0, 0);
      const actors: { y: number; draw: () => void }[] = [];

      if (s.map === "arrival") {
        // ølstand
        ctx.fillStyle = "#181010";
        ctx.fillRect(48, 98, 32, 12);
        ctx.fillStyle = "#8b5a2a";
        ctx.fillRect(49, 99, 30, 7);
        ctx.fillStyle = "#6b3a1a";
        ctx.fillRect(49, 106, 30, 3);
        ctx.fillRect(51, 109, 3, 4);
        ctx.fillRect(74, 109, 3, 4);
        if (!s.drunk) {
          const by = 88 + (Math.floor(t * 2) % 2);
          ctx.fillStyle = "#f8f8f8";
          ctx.fillRect(60, by, 8, 11);
          ctx.fillStyle = "#f8b828";
          ctx.fillRect(61, by + 3, 6, 7);
          ctx.fillStyle = "#f8f8f8";
          ctx.fillRect(68, by + 4, 2, 4);
          if (Math.floor(t * 3) % 3 === 0) {
            ctx.fillStyle = "#f8f8a0";
            ctx.fillRect(56, by - 4, 1, 3);
            ctx.fillRect(55, by - 3, 3, 1);
            ctx.fillRect(72, by + 1, 1, 3);
            ctx.fillRect(71, by + 2, 3, 1);
          }
        } else {
          ctx.fillStyle = "#c8c8c8";
          ctx.fillRect(60, 92, 8, 7);
        }
        actors.push({ y: BOUNCER_POS.y, draw: () => ctx.drawImage(bouncerImg, BOUNCER_POS.x - 10, BOUNCER_POS.y - 21) });
      } else {
        // danseguld
        const colors = ["#f040b0", "#30e0f0", "#f8d848", "#30f860", "#8040f0"];
        for (let ty = 5; ty <= 9; ty++)
          for (let tx = 3; tx <= 12; tx++) {
            ctx.fillStyle = colors[(tx * 3 + ty * 5 + Math.floor(t * 3)) % colors.length];
            ctx.fillRect(tx * T, ty * T, T, T);
            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.fillRect(tx * T, ty * T, T, 1);
            ctx.fillRect(tx * T, ty * T, 1, T);
          }
        // spotlys
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 3; i++) {
          const lx = 128 + Math.sin(t * (0.7 + i * 0.3) + i * 2) * 90;
          const ly = 120 + Math.cos(t * (0.9 + i * 0.2) + i) * 50;
          ctx.fillStyle = ["rgba(240,64,176,0.22)", "rgba(48,224,240,0.22)", "rgba(248,216,72,0.22)"][i];
          for (const [w, h] of [[28, 12], [20, 18], [12, 22]]) ctx.fillRect(Math.round(lx - w / 2), Math.round(ly - h / 2), w, h);
        }
        ctx.globalCompositeOperation = "source-over";
        // diskokugle
        ctx.fillStyle = "#888";
        ctx.fillRect(127, 0, 2, 8);
        ctx.fillStyle = "#c8c8d8";
        ctx.fillRect(120, 8, 16, 12);
        ctx.fillRect(122, 6, 12, 16);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = hash(i, Math.floor(t * 6)) > 0.5 ? "#f8f8f8" : "#8888a0";
          ctx.fillRect(122 + (i % 3) * 4, 9 + Math.floor(i / 3) * 5, 3, 3);
        }
        actors.push({ y: SANTA_POS.y, draw: () => ctx.drawImage(santaImg, SANTA_POS.x - 10, SANTA_POS.y - 21) });
        dancers.forEach((d, i) => {
          const beat = Math.floor(t * 4 + i) % 2;
          actors.push({
            y: d.y,
            draw: () => {
              ctx.save();
              if (Math.floor(t * 2 + i) % 2) {
                ctx.translate(d.x * 2, 0);
                ctx.scale(-1, 1);
              }
              ctx.drawImage(d.frames[beat ? 1 : 2], d.x - 10, d.y - 21 - beat * 2);
              ctx.restore();
            },
          });
        });
      }

      const frame = s.moving ? 1 + (Math.floor(t * 8) % 2) : 0;
      actors.push({
        y: s.y,
        draw: () => {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.fillRect(Math.round(s.x) - 5, Math.round(s.y) - 1, 10, 2);
          ctx.drawImage(frames[frame], Math.round(s.x) - 10, Math.round(s.y) - 21 - (s.moving && frame === 1 ? 1 : 0));
        },
      });
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

      if (s.map === "arrival") {
        // nat + lys
        ctx.fillStyle = "rgba(10,10,50,0.38)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(240,64,176,0.10)";
        ctx.fillRect(96, 32, 64, 40);
        ctx.fillRect(104, 40, 48, 32);
        ctx.fillStyle = "rgba(248,200,80,0.12)";
        ctx.fillRect(40, 80, 48, 40);
        ctx.globalCompositeOperation = "source-over";
        // neonskilt
        ctx.font = font;
        ctx.textAlign = "center";
        const on = Math.floor(t * 5) % 17 !== 0;
        ctx.fillStyle = "#05030a";
        ctx.fillRect(84, 6, 88, 18);
        ctx.fillStyle = on ? "#f040b0" : "#602050";
        ctx.fillRect(84, 6, 88, 1);
        ctx.fillRect(84, 23, 88, 1);
        ctx.fillRect(84, 6, 1, 18);
        ctx.fillRect(171, 6, 1, 18);
        ctx.fillStyle = on ? "#f8a0e0" : "#602050";
        ctx.fillText("DISKOTEK", 128, 19);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [character]);

  // Tastatur
  useEffect(() => {
    const keyMap: Record<string, string> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      d: "right",
      w: "up",
      s: "down",
    };
    const down = (e: KeyboardEvent) => {
      const k = keyMap[e.key];
      if (k) {
        e.preventDefault();
        state.current.keys.add(k);
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = keyMap[e.key];
      if (k) state.current.keys.delete(k);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const tapToMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    state.current.target = {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H + 4,
    };
  };

  const setPad = (x: number, y: number) => () => {
    state.current.pad = { x, y };
  };
  const clearPad = () => {
    state.current.pad = { x: 0, y: 0 };
  };
  const pressA = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));

  const objective =
    map === "disco" ? "Find Julemanden" : drunk ? "Gå ind på diskoteket" : "Find en øl og bund den";

  return (
    <div className="select-none">
      {/* HUD */}
      <div className="font-readable mb-2 flex items-start justify-between gap-2 text-lg leading-none sm:text-xl">
        <div>
          <p className="text-[#30c030]">- MÅL -</p>
          <p className="mt-1 text-[#f8f8f8]">{objective}</p>
        </div>
        <div className="text-right">
          <p className="text-[#e82828]">- LIFE -</p>
          <span className="mt-1 inline-block"><Hearts count={character.hearts} size={10} /></span>
          <p className="mt-0.5 text-[#f8d848]">ØL × {drunk ? 1 : 0}</p>
        </div>
      </div>

      <div className="relative overflow-hidden border-4 border-[#f8f8f8] shadow-[0_0_0_3px_#283890]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={tapToMove}
          className={`pixel-canvas block w-full touch-none ${drunk ? "animate-[sway_4s_ease-in-out_infinite]" : ""}`}
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
        />
        {dialog && <Dialog key={dialog.lines[0]} script={dialog} />}
        {chugging && (
          <Chug
            onDone={() => {
              setChugging(false);
              setDrunk(true);
              state.current.drunk = true;
              say(["Du har bundet øllen! Verden føles lidt blødere i kanterne.", "MÅL: Gå ind på DISKOTEKET."]);
            }}
          />
        )}
      </div>

      {/* Kontroller */}
      <div className="mt-4 flex items-center justify-between px-2">
        <div className="relative h-32 w-32" onPointerUp={clearPad} onPointerLeave={clearPad} onPointerCancel={clearPad}>
          {(
            [
              ["▲", 0, -1, "left-1/2 top-0 -translate-x-1/2"],
              ["▼", 0, 1, "left-1/2 bottom-0 -translate-x-1/2"],
              ["◀", -1, 0, "left-0 top-1/2 -translate-y-1/2"],
              ["▶", 1, 0, "right-0 top-1/2 -translate-y-1/2"],
            ] as const
          ).map(([label, x, y, pos]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onPointerDown={(e) => {
                e.preventDefault();
                setPad(x, y)();
              }}
              className={`dpad-btn absolute h-11 w-11 touch-none ${pos}`}
            >
              {label}
            </button>
          ))}
          <span className="absolute top-1/2 left-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 bg-[#282838]" />
        </div>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            pressA();
          }}
          className="a-btn h-16 w-16 touch-none rounded-full text-sm"
        >
          A
        </button>
      </div>
    </div>
  );
}
