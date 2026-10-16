"use client";

import { useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";
import billede from "@/public/julefrokost-billede.jpg";

// Escape room: billedet er skåret i 4 brikker. Tryk på to brikker for at bytte dem.
const POS = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];

function shuffled() {
  const options = [
    [3, 2, 1, 0],
    [1, 3, 0, 2],
    [2, 0, 3, 1],
    [3, 0, 2, 1],
  ];
  return options[Math.floor(Math.random() * options.length)];
}

export default function Puzzle({ onDone }: { onDone: () => void }) {
  const [order, setOrder] = useState<number[]>(shuffled);
  const [picked, setPicked] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const solved = order.every((p, i) => p === i);

  useEffect(() => {
    if (!solved) return;
    sfx.solved();
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [solved, onDone]);

  function tap(slot: number) {
    if (solved) return;
    if (picked === null) {
      sfx.move();
      return setPicked(slot);
    }
    if (picked !== slot) {
      sfx.click();
      setOrder((o) => {
        const n = [...o];
        [n[picked], n[slot]] = [n[slot], n[picked]];
        return n;
      });
      setMoves((m) => m + 1);
    }
    setPicked(null);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3">
      <div className="zelda-box w-full max-w-lg px-3 py-4 text-center">
        <p className="text-xs text-[#f8d848] sm:text-sm">{solved ? "I SLAP UD!" : "ESCAPE ROOM"}</p>
        <p className="font-readable mt-2 text-xl leading-tight sm:text-2xl">
          {solved ? `Klaret på ${moves} træk.` : "Saml billedet for at slippe ud. Tryk på to brikker for at bytte dem."}
        </p>
        <div className={`mt-3 grid aspect-video grid-cols-2 ${solved ? "gap-0" : "gap-1"} bg-[#101010] p-1 transition-all`}>
          {order.map((piece, slot) => (
            <button
              key={slot}
              type="button"
              aria-label={`Brik ${slot + 1}`}
              onClick={() => tap(slot)}
              className={`h-full w-full touch-manipulation outline-4 -outline-offset-4 ${
                picked === slot ? "outline outline-[#f8d848]" : ""
              }`}
              style={{
                backgroundImage: `url(${billede.src})`,
                backgroundSize: "200% 200%",
                backgroundPosition: POS[piece],
              }}
            />
          ))}
        </div>
        <p className="font-readable mt-2 text-lg text-[#c8c8c8]">TRÆK: {moves}</p>
      </div>
    </div>
  );
}
