"use client";

import { useEffect, useState } from "react";
import { getCharacter, type Character } from "@/lib/characters";
import { sfx } from "@/lib/sfx";
import { PixelSprite } from "../PixelArt";

// Før afgang: læg præcis 2.700 kr. på disken hos Arrangøren. Ingen byttepenge.
const PRICE = 2700;
const BILLS = [
  { value: 1000, count: 1, bg: "#b85a3a", edge: "#6a2a18" },
  { value: 500, count: 3, bg: "#3a78c8", edge: "#1a3a78" },
  { value: 200, count: 2, bg: "#48a848", edge: "#1e5a1e" },
  { value: 100, count: 3, bg: "#e0902a", edge: "#80480a" },
  { value: 50, count: 2, bg: "#9060c0", edge: "#4a2878" },
];
const kr = (n: number) => `${n.toLocaleString("da-DK")} KR.`;

export default function Payment({ character, onDone }: { character: Character; onDone: () => void }) {
  const organizer = getCharacter("alexander")!;
  const [counter, setCounter] = useState<number[]>([]); // index i BILLS for hver seddel på disken
  const [status, setStatus] = useState<"paying" | "over" | "paid">("paying");
  const total = counter.reduce((sum, i) => sum + BILLS[i].value, 0);
  const left = (i: number) => BILLS[i].count - counter.filter((c) => c === i).length;

  function put(i: number) {
    if (status !== "paying" || left(i) === 0) return;
    sfx.click();
    const next = [...counter, i];
    setCounter(next);
    if (next.reduce((sum, j) => sum + BILLS[j].value, 0) > PRICE) {
      sfx.denied();
      setStatus("over");
      setTimeout(() => {
        setCounter([]);
        setStatus("paying");
      }, 1600);
    }
  }

  function pay() {
    if (total !== PRICE || status !== "paying") return;
    setStatus("paid");
    sfx.solved();
    setTimeout(onDone, 2200);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") pay();
      const n = Number(e.key);
      if (n >= 1 && n <= BILLS.length) put(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const line =
    status === "paid"
      ? "Tak for handlen! Pengene er allerede brugt."
      : status === "over"
        ? "For meget! Arrangøren har ingen byttepenge. Prøv igen."
        : character.id === "alexander"
          ? "Du betaler til dig selv. Smart. Det er stadig 2.700 kr."
          : "Billet til ukendt destination: 2.700 kr. Præcis beløb. Ingen refusion. Ingen spørgsmål.";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="zelda-box px-3 py-2 text-center">
        <p className="text-[0.6rem] tracking-[0.2em] text-[#f8d848] sm:text-xs">- BETALING -</p>
      </div>

      {/* butikken */}
      <div className="relative border-4 border-[#f8f8f8] bg-[#3a2210] px-3 pt-4 pb-3 shadow-[0_0_0_3px_#283890]">
        <div className="flex items-end justify-between">
          <div className="flex flex-col items-center">
            <PixelSprite character={organizer} scale={4} className="animate-[bob_0.8s_steps(2)_infinite]" />
            <span className="font-readable text-lg leading-none text-[#f8d848]">ARRANGØREN</span>
          </div>
          <div className="font-readable mb-2 max-w-[60%] rounded-sm bg-[#f8f8f0] px-2 py-1 text-lg leading-tight text-[#202020]">
            {line}
          </div>
        </div>
        {/* disken */}
        <div className="relative mt-3 min-h-[4.5rem] border-4 border-[#6b3a1a] bg-[#8b5a2a] p-2">
          <div className="flex flex-wrap gap-1">
            {counter.map((i, k) => (
              <span
                key={k}
                className="animate-[drop-in_0.25s_ease-out_both] border-2 px-1 text-[0.45rem] leading-5 text-[#f8f8f8]"
                style={{ background: BILLS[i].bg, borderColor: BILLS[i].edge }}
              >
                {BILLS[i].value}
              </span>
            ))}
          </div>
          {status === "paid" && (
            <div className="stamp absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f0d8] px-2 py-1 text-[0.6rem] whitespace-nowrap opacity-95">
              BETALT · INGEN REFUSION
            </div>
          )}
        </div>
        <p className={`mt-2 text-center text-[0.6rem] sm:text-xs ${total > PRICE ? "text-[#e82828]" : total === PRICE ? "text-[#30f860]" : "text-[#f8f8f8]"}`}>
          {kr(total)} / {kr(PRICE)}
        </p>
      </div>

      {/* pungen */}
      <div className="zelda-box px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="font-readable text-xl leading-none text-[#30c030]">- {character.name.toUpperCase()}S PUNG -</p>
          <button
            type="button"
            onClick={() => status === "paying" && setCounter([])}
            disabled={!counter.length || status !== "paying"}
            className="font-readable text-xl leading-none text-[#c8c8c8] underline disabled:opacity-30"
          >
            Tag tilbage
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {BILLS.map((b, i) => (
            <button
              key={b.value}
              type="button"
              onClick={() => put(i)}
              disabled={left(i) === 0 || status !== "paying"}
              className="relative flex h-14 touch-manipulation flex-col items-center justify-center border-4 text-[0.6rem] text-[#f8f8f8] shadow-[3px_3px_0_#000] active:translate-y-0.5 disabled:opacity-30"
              style={{ background: b.bg, borderColor: b.edge }}
            >
              {b.value}
              <span className="font-readable mt-0.5 text-base leading-none">kr. × {left(i)}</span>
            </button>
          ))}
        </div>
        <p className="font-readable mt-3 text-lg leading-tight text-[#c8c8c8]">
          Tryk på sedlerne for at lægge dem på disken. Præcis beløb – ellers bliver det ikke til noget.
        </p>
      </div>

      <button
        type="button"
        onClick={pay}
        disabled={total !== PRICE || status !== "paying"}
        className="zelda-button w-full py-4 text-xs tracking-[0.15em] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
      >
        {status === "paid" ? "GOD TUR!" : "BETAL ▶"}
      </button>
    </div>
  );
}
