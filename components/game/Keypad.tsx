"use client";

import { useCallback, useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";

const newCode = () => String(Math.floor(1000 + Math.random() * 9000));

// Airbnb-check-in: husk koden fra værtens SMS og tast den ind på nøgleboksen.
export default function Keypad({ onDone }: { onDone: () => void }) {
  const [code] = useState(newCode);
  const [entry, setEntry] = useState("");
  const [showSms, setShowSms] = useState(true);
  const [status, setStatus] = useState<"idle" | "wrong" | "ok">("idle");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!showSms) return;
    const id = setTimeout(() => setShowSms(false), 3500);
    return () => clearTimeout(id);
  }, [showSms, tries]);

  const press = useCallback(
    (d: string) => {
      if (status === "ok" || showSms || entry.length >= 4) return;
      sfx.click();
      setStatus("idle");
      const next = entry + d;
      setEntry(next);
      if (next.length < 4) return;
      if (next === code) {
        setStatus("ok");
        sfx.solved();
        setTimeout(onDone, 1800);
      } else {
        setStatus("wrong");
        sfx.denied();
        setTimeout(() => {
          setEntry("");
          setTries((t) => t + 1);
          setShowSms(true);
        }, 900);
      }
    },
    [code, entry, onDone, showSms, status]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === "Backspace") setEntry((s) => s.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3">
      <div className="zelda-box w-full max-w-xs px-4 py-4 text-center">
        <p className="text-xs text-[#f8d848] sm:text-sm">AIRBNB CHECK-IN</p>

        <div className="font-readable mt-3 min-h-[4.5rem] text-left text-xl leading-tight">
          {showSms ? (
            <div className="rounded-sm bg-[#30c030] px-3 py-2 text-[#081808]">
              <span className="block text-base opacity-70">SMS fra værten{tries > 0 ? " (igen...)" : ""}:</span>
              Koden til nøgleboksen er <b className="tracking-[0.2em]">{code}</b>
            </div>
          ) : status === "ok" ? (
            <p className="text-[#30c030]">Klik! Du er checket ind. Lejligheden ligner ikke billederne. Overhovedet.</p>
          ) : status === "wrong" ? (
            <p className="text-[#e82828]">FORKERT! Værten har givet dig én stjerne og sender koden igen.</p>
          ) : (
            <p className="text-[#c8c8c8]">SMS&apos;en er slettet. Hvad var koden nu?</p>
          )}
        </div>

        <div className="mt-3 border-4 border-[#f8f8f8] bg-[#081808] py-2 text-lg tracking-[0.5em] text-[#30f860]">
          {entry.padEnd(4, "_")}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "RYD"].map((k, i) =>
            k === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => (k === "RYD" ? setEntry((s) => s.slice(0, -1)) : press(k))}
                disabled={showSms || status === "ok"}
                className="dpad-btn h-12 touch-manipulation text-sm disabled:opacity-40"
              >
                {k}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
