import type { Character } from "@/lib/characters";
import { buildSprite, palette, SPRITE_H, SPRITE_W } from "@/lib/sprites";

export function PixelSprite({
  character,
  scale = 4,
  className = "",
}: {
  character: Character;
  scale?: number;
  className?: string;
}) {
  const rows = buildSprite(character);
  const colors = palette(character);
  return (
    <svg
      viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
      width={SPRITE_W * scale}
      height={SPRITE_H * scale}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={character.name}
    >
      {rows.flatMap((row, y) =>
        row.split("").map((ch, x) =>
          ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={colors[ch]} />
        )
      )}
    </svg>
  );
}

const HEART = [".OO.OO.", "ORWORRO", "ORRRRRO", ".ORRRO.", "..ORO..", "...O..."];

export function PixelHeart({ full = true, size = 14 }: { full?: boolean; size?: number }) {
  const colors: Record<string, string> = full
    ? { O: "#181010", R: "#e82828", W: "#f8f8f8" }
    : { O: "#585858", R: "#202020", W: "#303030" };
  return (
    <svg viewBox="0 0 7 6" width={size} height={(size * 6) / 7} shapeRendering="crispEdges" aria-hidden>
      {HEART.flatMap((row, y) =>
        row.split("").map((ch, x) =>
          ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={colors[ch]} />
        )
      )}
    </svg>
  );
}

export function Hearts({ count, max = 10, size = 14 }: { count: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex flex-wrap gap-[2px]" aria-label={`${count} af ${max} hjerter`}>
      {Array.from({ length: max }, (_, i) => (
        <PixelHeart key={i} full={i < count} size={size} />
      ))}
    </span>
  );
}

export function MagicMeter({ value, max = 10 }: { value: number; max?: number }) {
  return (
    <span
      className="relative inline-block h-3 w-28 border-2 border-[#f8f8f8] bg-[#181818]"
      aria-label={`Charme ${value} af ${max}`}
    >
      <span className="absolute inset-y-0 left-0 bg-[#30c030]" style={{ width: `${(value / max) * 100}%` }} />
    </span>
  );
}

export function Triforce({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 14" width={size} height={(size * 14) / 16} shapeRendering="crispEdges" aria-hidden>
      <defs>
        <linearGradient id="tf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset="0.5" stopColor="#f8c830" />
          <stop offset="1" stopColor="#b07810" />
        </linearGradient>
      </defs>
      <polygon points="8,0 12,7 4,7" fill="url(#tf)" />
      <polygon points="4,7 8,14 0,14" fill="url(#tf)" />
      <polygon points="12,7 16,14 8,14" fill="url(#tf)" />
    </svg>
  );
}
