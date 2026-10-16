import type { Accessory, Character, HeadStyle } from "./characters";

// 16-bit-sprites tegnet pixel for pixel. Hver karakter = én farve-nøgle:
// O omrids · S hud · s hudskygge · E øjne · H hår · h hårskygge · A hat · a hatskygge
// T tunika · t tunikaskygge · B bælte · P bukser · K sko · G guld · W hvid · Q/q briller · L skjold
const BASE_W = 16;
const PAD = 2;
export const SPRITE_W = BASE_W + PAD * 2;
export const SPRITE_H = 22;

const HEADS: Record<HeadStyle, string[]> = {
  short: [
    "................",
    ".....OOOOOO.....",
    "....OHHHHHHO....",
    "...OHHHHHHHHO...",
    "..OHHHHHHHHHHO..",
    "..OHHhHHHHhHHO..",
    ".OHHSSSSSSSSHHO.",
  ],
  linkcap: [
    "......OOOO......",
    ".....OAAAAO.....",
    "....OAAAAAAOO...",
    "...OAAAAAAAAaO..",
    "..OHHHHHHHHHHaO.",
    "..OHHhHHHHhHHOaO",
    ".OHHSSSSSSSSHHOO",
  ],
  beanie: [
    ".......OO.......",
    ".....OOAAOO.....",
    "....OAAAAAAO....",
    "...OAAAAAAAAO...",
    "..OAAAAAAAAAAO..",
    "..OaaaaaaaaaaO..",
    ".OHHSSSSSSSSHHO.",
  ],
  strawhat: [
    "......OOOO......",
    ".....OAAAAO.....",
    "....OAAAAAAO....",
    "....OaaaaaaO....",
    "OOOOAAAAAAAAOOOO",
    "OAAAAAAAAAAAAAAO",
    ".OOHSSSSSSSSHOO.",
  ],
  spiky: [
    "...O..O..O..O...",
    "..OHO.OHOOHOOHO.",
    "..OHHOHHHHHHHHO.",
    ".OHHHHHHHHHHHHO.",
    "..OHHHHHHHHHHO..",
    "..OHhHHhHHhHHO..",
    ".OHHSSSSSSSSHHO.",
  ],
  buzz: [
    "................",
    "................",
    ".....OOOOOO.....",
    "....OhhhhhhO....",
    "...OhHHHHHHhO...",
    "..OhSSSSSSSShO..",
    ".OSSSSSSSSSSSSO.",
  ],
  slick: [
    "................",
    ".....OOOOOO.....",
    "....OHHHHHHO....",
    "...OHHhHHhHHO...",
    "..OHHHHHHHHHHO..",
    "..OHSSSSSSSSHO..",
    ".OHSSSSSSSSSSHO.",
  ],
  swoop: [
    "................",
    ".....OOOOOO.....",
    "...OOHHHHHHO....",
    "..OHHHHHHHHHO...",
    "..OHHHHHHHHHHO..",
    "..OHHHHHHHhSSO..",
    ".OHHHHHSSSSSSHO.",
  ],
};

const FACE_AND_BODY = [
  ".OSSSESSSSESSSO.",
  ".OsSSESSSSESSsO.",
  "..OSSSSSSSSSSO..",
  "...OSSSssSSSO...",
  "......OSSO......",
  "....OOTTTTOO....",
  "...OTTTTTTTTO...",
  "..OTOTTTTTTOTO..",
  "..OTOTTTTTTOTO..",
  "..OSOBBBBBBOSO..",
  "..OOOtTTTTtOOO..",
  "....OttOOttO....",
  "....OPPOOPPO....",
  "...OKKKOOKKKO...",
  "...OOOOOOOOOO...",
];

// Overlays i polstrede koordinater (bredde 20). "." = rør ikke.
const ACCESSORIES: Record<Accessory, { x: number; y: number; rows: string[] }> = {
  sunglasses: { x: PAD + 3, y: 7, rows: ["QqQQQQQqQQ", ".QQ....QQ."] },
  chain: { x: PAD + 5, y: 13, rows: ["G....G", ".GGGG."] },
  gloves: { x: PAD + 3, y: 15, rows: ["G........G", "G........G"] },
  shield: { x: 0, y: 13, rows: [".OOO.", "OLGLO", "OGGGO", "OLGLO", ".OLO.", "..O.."] },
  mug: { x: PAD + 13, y: 13, rows: [".WWW.", "OWWWO", "OGGGOO", "OGGGOO", "OOOOO."] },
};

export function buildSprite(c: Character): string[] {
  const rows = [...HEADS[c.look.head], ...FACE_AND_BODY].map(
    (r) => ".".repeat(PAD) + r + ".".repeat(PAD)
  );
  const grid = rows.map((r) => r.split(""));
  for (const acc of c.look.accessories ?? []) {
    const o = ACCESSORIES[acc];
    o.rows.forEach((row, dy) =>
      row.split("").forEach((ch, dx) => {
        const x = o.x + dx;
        if (ch !== "." && grid[o.y + dy]?.[x] !== undefined) grid[o.y + dy][x] = ch;
      })
    );
  }
  return grid.map((r) => r.join(""));
}

export function palette(c: Character): Record<string, string> {
  const l = c.look;
  return {
    O: "#181010",
    S: "#f8b880",
    s: "#c87848",
    E: "#181010",
    H: l.hair,
    h: l.hairShade,
    A: l.hat ?? l.hair,
    a: l.hatShade ?? l.hairShade,
    T: l.tunic,
    t: l.tunicShade,
    B: "#6b3a1a",
    P: l.pants ?? "#e0c890",
    K: "#6b3a1a",
    G: "#f8c830",
    W: "#f8f8f8",
    Q: "#101018",
    q: "#7090d8",
    L: "#2850c8",
  };
}
