// Tegn pixel-strenge til canvas. Hvert tegn slås op i en palet; "." er gennemsigtig.
export function drawRows(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  colors: Record<string, string>,
  x = 0,
  y = 0
) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const ch = row[dx];
      if (ch === "." || ch === " ") continue;
      ctx.fillStyle = colors[ch] ?? "#ff00ff";
      ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  });
}

export function spriteCanvas(rows: string[], colors: Record<string, string>) {
  const c = document.createElement("canvas");
  c.width = Math.max(...rows.map((r) => r.length));
  c.height = rows.length;
  drawRows(c.getContext("2d")!, rows, colors);
  return c;
}

export function canvasOf(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  return c;
}

// Deterministisk "tilfældighed" pr. koordinat, så kortene ser ens ud hver gang.
export function hash(x: number, y: number, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
