"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { characters, type Character } from "@/lib/characters";
import { pixelFont } from "@/lib/fonts";
import { bouncer, casperHedegaard, danceGirl, santa } from "@/lib/npcs";
import { canvasOf, drawRows, hash, spriteCanvas } from "@/lib/pixels";
import { sfx } from "@/lib/sfx";
import { buildWalkFrames, palette } from "@/lib/sprites";
import { quests } from "@/lib/quests";
import Chug from "./Chug";
import Dialog, { type DialogScript } from "./Dialog";
import Dinner from "./Dinner";
import Encounter from "./Encounter";
import Keypad from "./Keypad";
import Puzzle from "./Puzzle";
import QuestList from "./QuestList";
import { Hearts } from "../PixelArt";

const W = 256;
const H = 224;
const T = 16;
const SPEED = 80; // px/s

type MapId = "town" | "disco";
type MiniGame = "chug" | "puzzle" | "keypad" | "dinner";
type Rect = { x: number; y: number; w: number; h: number };

// 16×14 fliser. Se TILE_SOLID for hvad man ikke kan gå igennem.
const MAPS: Record<MapId, string[]> = {
  // Fire bygninger på rad (1-4), hver med en dør (d): det låste rum, Airbnb, restaurant, diskotek.
  town: [
    "1111222233334444",
    "1111222233334444",
    "1dd12dd23dd34dd4",
    "gppggppggppggppg",
    "gppppppppppppppg",
    "TgfggggppggggfgT",
    "TggBBggppggfgggT",
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
    "WWWWWWWxxWWWWWWW",
  ],
};
const TILE_SOLID = new Set(["1", "2", "3", "4", "T", "B", "W", "J", "R", "S"]);
const START: Record<MapId, { x: number; y: number }> = {
  town: { x: 56, y: 190 },
  disco: { x: 128, y: 200 },
};

const PLANE_RECTS: Rect[] = [
  { x: 150, y: 178, w: 106, h: 22 },
  { x: 186, y: 160, w: 24, h: 64 },
];
const BOUNCER_POS = { x: 200, y: 60 };
const SIGNS = ["?????", "AIRBNB", "BISTRO", "DISKO"];
// facadefarver: [mur, fuge, lys i vinduer/dør, skiltets neon]
const BUILDINGS = [
  { wall: "#4a4a5a", line: "#30303c", glow: "#60f0a0", neon: "#30f860" },
  { wall: "#8b5a2a", line: "#6b3a1a", glow: "#f8d878", neon: "#f8a040" },
  { wall: "#a04030", line: "#702818", glow: "#f8b858", neon: "#f8d848" },
  { wall: "#2a1238", line: "#1a0828", glow: "#c060f0", neon: "#f040b0" },
];
const SANTA_POS = { x: 128, y: 46 };
const BEER_STAND: Rect = { x: 48, y: 96, w: 32, h: 16 };
// Casper Hedegaard og hans dansepartner midt på gulvet
const COUPLE = [
  { x: 144, y: 124 },
  { x: 160, y: 124 },
];
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
const TREE_COLORS = {
  O: "#102810",
  G: "#2c7a2c",
  g: "#1c5a1c",
  L: "#58b048",
  K: "#6b3a1a",
};

const hits = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const feetBox = (x: number, y: number): Rect => ({
  x: x - 5,
  y: y - 5,
  w: 10,
  h: 6,
});
const grow = (r: Rect, n: number): Rect => ({
  x: r.x - n,
  y: r.y - n,
  w: r.w + n * 2,
  h: r.h + n * 2,
});

// ---------- Baggrunde (tegnes én gang pr. kort) ----------
function drawTile(
  ctx: CanvasRenderingContext2D,
  ch: string,
  tx: number,
  ty: number,
) {
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
      for (let i = 0; i < 4; i++)
        px(
          Math.floor(hash(tx, ty, i) * 14),
          Math.floor(hash(ty, tx, i) * 14),
          "#a08050",
          2,
          1,
        );
      return;
    case "t":
      px(0, 0, "#58586a", T, T);
      for (let i = 0; i < 3; i++)
        px(
          Math.floor(hash(tx, ty, i) * 15),
          Math.floor(hash(ty, tx, i) * 15),
          "#4a4a5a",
        );
      if (ty === 12 && tx % 2 === 0) px(2, 7, "#e8e8e8", 10, 2);
      return;
    case "T":
      grass();
      drawRows(ctx, TREE, TREE_COLORS, x, y);
      return;
    case "B":
      grass();
      return; // ølstanden tegnes som objekt
    case "1":
    case "2":
    case "3":
    case "4": {
      const b = BUILDINGS[Number(ch) - 1];
      px(0, 0, b.wall, T, T);
      for (let r = 0; r < 4; r++) px(0, r * 4 + 3, b.line, T, 1);
      for (let r = 0; r < 4; r++)
        px(((r % 2) * 8 + 4) % T, r * 4, b.line, 1, 3);
      if (ch === "2" && ty === 0) {
        // tegltag
        px(0, 0, "#a03030", T, 7);
        for (let i = 0; i < 4; i++)
          px(i * 4 + (tx % 2) * 2, 3, "#701818", 2, 1);
        px(0, 6, "#501010", T, 1);
      }
      if (ch === "3" && ty === 1)
        for (let i = 0; i < 4; i++)
          px(i * 4, 11, i % 2 ? "#f8f8f8" : "#d03030", 4, 5); // markise
      if (ch === "4" && ty === 2) px(0, 15, "#f040b0", T, 1);
      if (tx % 4 === 3) px(15, 0, "#05030a", 1, T); // mellemrum mellem husene
      return;
    }
    case "d": {
      const b = BUILDINGS[Math.floor(tx / 4)];
      const left = tx % 4 === 1;
      px(0, 0, b.line, T, T);
      px(left ? 2 : 0, 2, "#05030a", 14, 14);
      px(left ? 2 : 0, 2, b.glow, 14, 1);
      if (tx < 4 && !left) {
        px(0, 8, "#f8d848", 4, 4); // hængelås
        px(1, 6, "#f8d848", 2, 2);
      }
      if (tx >= 4 && tx < 8 && !left) px(4, 7, "#303040", 5, 6); // nøgleboks
      if (tx >= 4 && tx < 8 && !left) px(5, 8, "#30f860", 3, 1);
      if (tx >= 8 && tx < 12) px(left ? 4 : 2, 5, "#f8b858", 10, 5); // varmt lys i glasdør
      return;
    }
    case "x":
      px(0, 0, "#05030a", T, T);
      px(0, 0, "#f040b0", T, 1);
      if (tx === 7) px(0, 0, "#f040b0", 1, T);
      if (tx === 8) px(15, 0, "#f040b0", 1, T);
      return;
    case "W":
      px(0, 0, "#120a1e", T, T);
      for (let i = 0; i < 2; i++)
        px(
          Math.floor(hash(tx, ty, i) * 15),
          Math.floor(hash(ty, tx, i) * 15),
          "#20142e",
        );
      if (ty === 1) px(0, 14, "#30e0f0", T, 1);
      if (ty === 13 && (tx === 6 || tx === 9))
        px(tx === 6 ? 15 : 0, 0, "#30e0f0", 1, T);
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
      if (ty === 3)
        for (let i = 0; i < 4; i++)
          px(
            2 + i * 3,
            7,
            ["#30e0f0", "#f040b0", "#f8d848", "#30f860"][i],
            2,
            2,
          );
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
    MAPS[map].forEach((row, ty) =>
      row.split("").forEach((ch, tx) => drawTile(ctx, ch, tx, ty)),
    );
    if (map === "town") {
      // vinduer i facaderne
      BUILDINGS.forEach((b, i) => {
        for (const wx of [i * 64 + 3, i * 64 + 51]) {
          ctx.fillStyle = "#05030a";
          ctx.fillRect(wx, 22, 10, 10);
          ctx.fillStyle = i === 0 ? "#202028" : b.glow;
          ctx.fillRect(wx + 1, 23, 8, 8);
          ctx.fillStyle = "#05030a";
          ctx.fillRect(wx + 5, 23, 1, 8);
          if (i === 0) ctx.fillRect(wx + 2, 23, 1, 8); // tremmer
          if (i === 0) ctx.fillRect(wx + 7, 23, 1, 8);
        }
      });
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
  const [map, setMap] = useState<MapId>("town");
  const [progress, setProgress] = useState(0); // antal klarede opgaver
  const [dialog, setDialog] = useState<DialogScript | null>(null);
  const [game, setGame] = useState<MiniGame | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [fade, setFade] = useState(false);
  const [encounter, setEncounter] = useState(false);
  const drunk = progress >= 1;

  const state = useRef({
    map: "town" as MapId,
    x: START.town.x,
    y: START.town.y,
    moving: false,
    target: null as { x: number; y: number } | null,
    keys: new Set<string>(),
    pad: { x: 0, y: 0 },
    busy: false,
    progress: 0,
    cooldown: 0,
  });

  const busy = Boolean(dialog || game || fade || paused || encounter);
  state.current.busy = busy;
  state.current.progress = progress;

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
      if (next === "disco") setEncounter(true);
      setTimeout(() => setFade(false), 250);
    }, 400);
  }, []);

  // Kaldes når et minispil er klaret: flueben på listen + næste mål.
  const finish = useCallback(
    (lines: string[]) => {
      setGame(null);
      const done = state.current.progress + 1;
      state.current.progress = done;
      setProgress(done);
      setToast(quests[done - 1].label);
      setTimeout(() => setToast(null), 2200);
      say([...lines, `NÆSTE OPGAVE: ${quests[done].goal}.`]);
    },
    [say],
  );

  // Velkomst ved ankomst
  useEffect(() => {
    say([
      `Velkommen til Destinationen, ${character.name}!`,
      "Ingen ved, hvor I er. Men der er en opgaveliste.",
      "Klar opgaverne i rækkefølge. Brug pilene, eller tryk der, hvor du vil gå hen.",
      `FØRSTE OPGAVE: ${quests[0].goal}.`,
    ]);
  }, [character.name, say]);

  // Hvad der sker ved hver dør, alt efter hvor langt man er nået.
  const knock = (door: number, s: typeof state.current) => {
    const need = door + 1; // dør 1 kræver 1 klaret opgave osv.
    if (s.progress < need) {
      sfx.denied();
      return say([
        [
          "DEN MYSTISKE DØR: Lukket for ædru gæster. Bund en øl først.",
          "AIRBNB: Check-in åbner først, når I er sluppet ud af det låste rum.",
          "BISTRO: Jeres bord er ikke klar endnu. Se opgavelisten.",
          "DØRMANDEN: Stop der! Ingen kommer ind på DISKOTEKET, før opgavelisten er klaret.",
        ][door],
      ]);
    }
    if (s.progress > need)
      return say([
        [
          "Ingen vil tilbage derind. Nogensinde.",
          "Du har allerede checket ind. Sengen kan vente.",
          "Du er mæt og fuld. Mest fuld.",
        ][door],
      ]);
    if (door === 0)
      say(
        [
          "Døren smækker i bag dig. Rummet er låst!",
          "Den eneste ledetråd er et billede, revet i fire stykker...",
        ],
        () => setGame("puzzle"),
      );
    else if (door === 1)
      say(
        [
          "Nøgleboksen kræver en kode.",
          "Værten har sendt en SMS. Læs hurtigt!",
        ],
        () => setGame("keypad"),
      );
    else if (door === 2)
      say(
        [
          "TJENEREN: Velkommen! Køkkenet og baren er lidt... kaotiske i aften.",
          "Grib maden og cocktailsene, før de rammer gulvet. Og hold dig fra salaten.",
        ],
        () => setGame("dinner"),
      );
    else goTo("disco");
  };

  // Hændelser når helten rammer bestemte steder
  const triggers = useRef<(s: typeof state.current) => void>(() => {});
  triggers.current = (s) => {
    const feet = feetBox(s.x, s.y);
    if (s.map === "town") {
      if (s.progress === 0 && hits(feet, grow(BEER_STAND, 4))) {
        s.target = null;
        say(["Du fandt en kold ØL!", "Der er kun én ting at gøre..."], () =>
          setGame("chug"),
        );
      } else if (feet.y < 3 * T) {
        const cx = feet.x + feet.w / 2;
        const door = Math.floor(cx / 64);
        const inDoor = cx % 64 > 14 && cx % 64 < 50;
        if (!inDoor) return;
        s.target = null;
        if (!(door === 3 && s.progress >= 4)) s.y += 14;
        knock(door, s);
      }
    } else if (hits(feet, { x: 88, y: 62, w: 80, h: 14 })) {
      s.target = null;
      say(
        [
          `JULEMANDEN: Ho ho ho, ${character.name}!`,
          "Du har rejst langt for at komme hertil. Hvorhen, ved ingen.",
          "Men før festen kan begynde, skal du underskrive dette pergament.",
          "Læs det grundigt. Eller lad være. Det ændrer intet.",
        ],
        onWaiver,
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
    const bgs: Record<MapId, HTMLCanvasElement> = {
      town: buildBackground("town"),
      disco: buildBackground("disco"),
    };
    const frames = buildWalkFrames(character).map((f) =>
      spriteCanvas(f, palette(character)),
    );
    const npcSprite = (c: Character) =>
      buildWalkFrames(c).map((f) => spriteCanvas(f, palette(c)));
    const bouncerImg = npcSprite(bouncer)[0];
    const santaImg = npcSprite(santa)[0];
    const dancers = characters
      .filter((c) => c.id !== character.id && c.id !== "casper" && !c.gameOver)
      .slice(0, DANCE_SPOTS.length)
      .map((c, i) => ({ frames: npcSprite(c), ...DANCE_SPOTS[i] }));
    const couple = [casperHedegaard, danceGirl].map((c, i) => ({
      frames: npcSprite(c),
      ...COUPLE[i],
    }));
    const font = `8px ${pixelFont.style.fontFamily}`;

    const solidAt = (s: typeof state.current, box: Rect) => {
      if (box.x < 0 || box.y < 0 || box.x + box.w > W || box.y + box.h > H)
        return true;
      const grid = MAPS[s.map];
      for (
        let ty = Math.floor(box.y / T);
        ty <= Math.floor((box.y + box.h - 1) / T);
        ty++
      )
        for (
          let tx = Math.floor(box.x / T);
          tx <= Math.floor((box.x + box.w - 1) / T);
          tx++
        )
          if (TILE_SOLID.has(grid[ty]?.[tx] ?? "w")) return true;
      const objects: Rect[] =
        s.map === "town"
          ? [...PLANE_RECTS, BEER_STAND, feetBox(BOUNCER_POS.x, BOUNCER_POS.y)]
          : [
              feetBox(SANTA_POS.x, SANTA_POS.y),
              ...DANCE_SPOTS.map((d) => feetBox(d.x, d.y)),
              ...COUPLE.map((d) => feetBox(d.x, d.y)),
            ];
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
        const wob =
          s.progress >= 4
            ? Math.sin(t * 2.2) * 0.55
            : s.progress >= 1
              ? Math.sin(t * 3) * 0.35
              : 0;
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

      if (s.map === "town") {
        // ølstand
        ctx.fillStyle = "#181010";
        ctx.fillRect(48, 98, 32, 12);
        ctx.fillStyle = "#8b5a2a";
        ctx.fillRect(49, 99, 30, 7);
        ctx.fillStyle = "#6b3a1a";
        ctx.fillRect(49, 106, 30, 3);
        ctx.fillRect(51, 109, 3, 4);
        ctx.fillRect(74, 109, 3, 4);
        if (s.progress === 0) {
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
        actors.push({
          y: BOUNCER_POS.y,
          draw: () =>
            ctx.drawImage(bouncerImg, BOUNCER_POS.x - 10, BOUNCER_POS.y - 21),
        });
      } else {
        // danseguld
        const colors = ["#f040b0", "#30e0f0", "#f8d848", "#30f860", "#8040f0"];
        for (let ty = 5; ty <= 9; ty++)
          for (let tx = 3; tx <= 12; tx++) {
            ctx.fillStyle =
              colors[(tx * 3 + ty * 5 + Math.floor(t * 3)) % colors.length];
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
          ctx.fillStyle = [
            "rgba(240,64,176,0.22)",
            "rgba(48,224,240,0.22)",
            "rgba(248,216,72,0.22)",
          ][i];
          for (const [w, h] of [
            [28, 12],
            [20, 18],
            [12, 22],
          ])
            ctx.fillRect(Math.round(lx - w / 2), Math.round(ly - h / 2), w, h);
        }
        ctx.globalCompositeOperation = "source-over";
        // diskokugle
        ctx.fillStyle = "#888";
        ctx.fillRect(127, 0, 2, 8);
        ctx.fillStyle = "#c8c8d8";
        ctx.fillRect(120, 8, 16, 12);
        ctx.fillRect(122, 6, 12, 16);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle =
            hash(i, Math.floor(t * 6)) > 0.5 ? "#f8f8f8" : "#8888a0";
          ctx.fillRect(122 + (i % 3) * 4, 9 + Math.floor(i / 3) * 5, 3, 3);
        }
        actors.push({
          y: SANTA_POS.y,
          draw: () =>
            ctx.drawImage(santaImg, SANTA_POS.x - 10, SANTA_POS.y - 21),
        });
        // parret danser i takt og kigger på hinanden; hjerter stiger op
        const beat = Math.floor(t * 4) % 2;
        couple.forEach((d, i) => {
          actors.push({
            y: d.y,
            draw: () => {
              ctx.save();
              if (i === 1) {
                ctx.translate(d.x * 2, 0);
                ctx.scale(-1, 1);
              }
              ctx.drawImage(
                d.frames[beat ? 1 : 2],
                d.x - 10,
                d.y - 21 - beat * 2,
              );
              ctx.restore();
            },
          });
        });
        actors.push({
          y: 999,
          draw: () => {
            const phase = (t % 1.6) / 1.6;
            const hx = Math.round(152 + Math.sin(t * 5) * 2);
            const hy = Math.round(98 - phase * 18);
            ctx.globalAlpha = 1 - phase;
            drawRows(
              ctx,
              [
                ".RR.RR.",
                "RRRRRRR",
                "RRRRRRR",
                ".RRRRR.",
                "..RRR..",
                "...R...",
              ],
              { R: "#f83870" },
              hx - 3,
              hy,
            );
            ctx.globalAlpha = 1;
          },
        });
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
              ctx.drawImage(
                d.frames[beat ? 1 : 2],
                d.x - 10,
                d.y - 21 - beat * 2,
              );
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
          ctx.drawImage(
            frames[frame],
            Math.round(s.x) - 10,
            Math.round(s.y) - 21 - (s.moving && frame === 1 ? 1 : 0),
          );
        },
      });
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

      if (s.map === "town") {
        // nat + lys foran dørene; den næste dør pulserer
        ctx.fillStyle = "rgba(10,10,50,0.38)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";
        BUILDINGS.forEach((b, i) => {
          const next = s.progress === i + 1;
          ctx.globalAlpha = next ? 0.16 + Math.sin(t * 4) * 0.08 : 0.07;
          ctx.fillStyle = b.glow;
          ctx.fillRect(i * 64 + 8, 32, 48, 32);
          ctx.fillRect(i * 64 + 16, 40, 32, 28);
        });
        ctx.globalAlpha = 1;
        if (s.progress === 0) {
          ctx.fillStyle = "rgba(248,200,80,0.12)";
          ctx.fillRect(40, 80, 48, 40);
        }
        ctx.globalCompositeOperation = "source-over";
        // skilte
        ctx.font = font;
        ctx.textAlign = "center";
        SIGNS.forEach((label, i) => {
          const b = BUILDINGS[i];
          const on = i < 3 || Math.floor(t * 5) % 17 !== 0;
          const x = i * 64 + 6;
          ctx.fillStyle = "#05030a";
          ctx.fillRect(x, 4, 52, 14);
          ctx.fillStyle = on ? b.neon : "#402040";
          ctx.fillRect(x, 4, 52, 1);
          ctx.fillRect(x, 17, 52, 1);
          ctx.fillText(label, i * 64 + 32, 15);
          if (s.progress > i + 1) {
            // klaret: grønt flueben på skiltet
            ctx.fillStyle = "#30f860";
            ctx.fillRect(x + 44, 22, 2, 2);
            ctx.fillRect(x + 46, 24, 2, 2);
            ctx.fillRect(x + 48, 22, 2, 2);
            ctx.fillRect(x + 50, 20, 2, 2);
          }
        });
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
  const pressA = () =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));

  return (
    <div className="select-none lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6">
      {/* HUD – over spillet på mobil, i højre side på desktop */}
      <div className="mb-2 flex items-start gap-2 lg:sticky lg:top-6 lg:order-2 lg:mb-0 lg:flex-col lg:items-stretch lg:gap-4">
        <QuestList done={progress} className="flex-1" />
        <div className="font-readable shrink-0 pt-2 text-right text-lg leading-none sm:text-xl lg:pt-0 lg:text-left">
          <p className="text-[#e82828]">- LIFE -</p>
          <span className="mt-1 inline-block">
            <Hearts count={character.hearts} size={10} />
          </span>
          <p className="mt-1 text-[#f8d848]">ØL × {drunk ? 1 : 0}</p>
        </div>
        <p className="font-readable hidden text-lg leading-tight text-[#888] lg:block">
          PILE / WASD: gå
          <br />
          ENTER / X: videre
          <br />
          Eller klik, hvor du vil hen.
        </p>
      </div>

      <div className="lg:order-1">
        {map === "disco" && (
          <p className="font-readable mb-2 text-center text-xl leading-none text-[#f8d848]">
            MÅL: Find Julemanden
          </p>
        )}

        <div className="relative overflow-hidden border-4 border-[#f8f8f8] shadow-[0_0_0_3px_#283890]">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={tapToMove}
            className={`pixel-canvas block w-full touch-none ${
              progress >= 4
                ? "animate-[sway-hard_3s_ease-in-out_infinite]"
                : drunk
                  ? "animate-[sway_4s_ease-in-out_infinite]"
                  : ""
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
          />
          {dialog && <Dialog key={dialog.lines[0]} script={dialog} />}
          {encounter && (
            <Encounter
              hero={character}
              onDone={() => {
                state.current.cooldown = 0.4;
                setEncounter(false);
              }}
            />
          )}
          {toast && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-2">
              <div className="zelda-box animate-[item-get_0.6s_ease-out_both] px-3 py-2 text-center">
                <p className="text-[0.55rem] text-[#30f860] sm:text-xs">
                  OPGAVE KLARET!
                </p>
                <p className="font-readable mt-1 text-lg leading-none">
                  {toast}
                </p>
              </div>
            </div>
          )}
          {game === "chug" && (
            <Chug
              onDone={() =>
                finish([
                  "Du har bundet øllen! Verden føles lidt blødere i kanterne.",
                ])
              }
            />
          )}
        </div>
        {game === "puzzle" && (
          <Puzzle
            onDone={() =>
              finish(["Klik! I slap ud. Med 59 minutter til overs. Næsten."])
            }
          />
        )}
        {game === "keypad" && (
          <Keypad
            onDone={() =>
              finish(["Bagagen er smidt. Sengene er fordelt. Ingen er enige."])
            }
          />
        )}
        {game === "dinner" && (
          <Dinner
            input={() => {
              const st = state.current;
              return (
                st.pad.x +
                (st.keys.has("right") ? 1 : 0) -
                (st.keys.has("left") ? 1 : 0)
              );
            }}
            onDone={() =>
              finish([
                "Maven er fuld. Det samme er du.",
                "Verden drejer en del mere nu.",
              ])
            }
          />
        )}

        {/* Kontroller */}
        <div className="mt-4 flex items-center justify-between px-2 lg:hidden">
          <div
            className="relative h-32 w-32"
            onPointerUp={clearPad}
            onPointerLeave={clearPad}
            onPointerCancel={clearPad}
          >
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
    </div>
  );
}
