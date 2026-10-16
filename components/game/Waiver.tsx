"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import type { Character } from "@/lib/characters";
import { santa } from "@/lib/npcs";
import { sfx } from "@/lib/sfx";
import { intro, paragraphs } from "@/lib/waiver";
import { PixelSprite } from "../PixelArt";

export type Receipt = { id: string; name: string; signedAt: string; signature: string };

export default function Waiver({ character, onSigned }: { character: Character; onSigned: (r: Receipt) => void }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [name, setName] = useState(`${character.name} `);
  const [accepted, setAccepted] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && accepted && hasDrawn && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !sigRef.current) return;
    setSubmitting(true);
    setError(null);
    const signature = sigRef.current.getCanvas().toDataURL("image/png");
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), signature, character: character.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ukendt fejl");
      onSigned({ ...data, signature });
    } catch (err) {
      sfx.denied();
      setError(err instanceof Error ? err.message : "Noget gik galt. Prøv igen.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 px-3 py-6">
      <article className="parchment font-readable relative mx-auto w-full max-w-2xl px-5 py-8 text-[#2a1a0a] sm:px-10">
        <header className="text-center">
          <div className="flex justify-center">
            <PixelSprite character={santa} scale={3} />
          </div>
          <p className="font-pixel mt-3 text-[0.5rem] tracking-[0.2em] text-[#7a4a1a] sm:text-[0.6rem]">
            DOKUMENT NR. XXX-2026-XMAS · FORTROLIGT
          </p>
          <h1 className="font-pixel mt-4 text-[clamp(0.8rem,4.1vw,1.6rem)] leading-tight text-[#a01818] [text-shadow:2px_2px_0_#f8d848]">
            ANSVARSFRASKRIVELSE
          </h1>
          <p className="font-pixel mt-3 text-[0.6rem] text-[#5a3a10] sm:text-xs">JULEFROKOST ANNO 2026</p>
          <p className="font-pixel mt-2 text-[0.5rem] text-[#7a5a30] sm:text-[0.6rem]">DESTINATION: ██████████</p>
          <p className="mt-5 text-2xl leading-tight">{intro}</p>
        </header>

        <section className="mt-8 space-y-6">
          {paragraphs.map((p, i) => (
            <div key={p.title}>
              <h2 className="flex items-baseline gap-2 text-[1.6rem] leading-none text-[#a01818]">
                <span>§{i + 1}</span>
                <span className="text-[#3a2210] uppercase">{p.title}</span>
              </h2>
              <p className="mt-2 border-l-4 border-[#c8a060] pl-3 text-[1.35rem] leading-[1.15] sm:text-[1.5rem]">
                {p.body}
              </p>
            </div>
          ))}
        </section>

        <form onSubmit={submit} className="mt-10 space-y-6 border-t-4 border-dashed border-[#c8a060] pt-6">
          <h2 className="font-pixel text-center text-xs text-[#a01818] sm:text-sm">UNDERSKRIFT</h2>

          <label className="block">
            <span className="font-pixel text-[0.55rem] text-[#5a3a10] sm:text-[0.65rem]">FULDE NAVN</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fornavn Efternavn"
              className="mt-2 w-full border-4 border-[#3a2210] bg-[#fff8e0] px-3 py-1.5 text-2xl outline-none focus:border-[#a01818]"
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-[1.35rem] leading-[1.15]">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                sfx.move();
              }}
              className="pixel-check mt-1"
            />
            <span>
              Jeg accepterer vilkårene i §1–§{paragraphs.length} – og erkender, at jeg ikke har læst dem.
            </span>
          </label>

          <div>
            <div className="flex items-end justify-between">
              <span className="font-pixel text-[0.55rem] text-[#5a3a10] sm:text-[0.65rem]">DIGITAL UNDERSKRIFT</span>
              <button
                type="button"
                disabled={!hasDrawn}
                onClick={() => {
                  sigRef.current?.clear();
                  setHasDrawn(false);
                }}
                className="font-pixel text-[0.55rem] text-[#7a4a1a] underline disabled:opacity-30"
              >
                RYD
              </button>
            </div>
            <div className="relative mt-2 border-4 border-[#3a2210] bg-[#fff8e0]">
              <SignatureCanvas
                ref={sigRef}
                penColor="#1a1008"
                minWidth={1}
                maxWidth={2.8}
                onEnd={() => setHasDrawn(true)}
                canvasProps={{ className: "block h-44 w-full sm:h-52", "aria-label": "Underskriftsfelt" }}
              />
              <div className="pointer-events-none absolute right-5 bottom-9 left-5 border-b-2 border-dashed border-[#3a2210]/30" />
              <span className="font-pixel pointer-events-none absolute bottom-3 left-5 text-[0.5rem] text-[#3a2210]/40">
                ✗ UNDERSKRIV HER
              </span>
              {!accepted && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#101850]/90 p-4 text-center text-2xl leading-tight text-[#f8d848]">
                  Accepter vilkårene for at underskrive
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-center text-2xl text-[#a01818]">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="zelda-button font-pixel w-full py-4 text-xs tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
          >
            {submitting ? "FORSEGLER..." : "UNDERSKRIV ▶"}
          </button>
        </form>
      </article>
    </div>
  );
}
