"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import confetti from "canvas-confetti";
import { useCharacter } from "./Game";
import { PixelSprite } from "./PixelArt";

type Receipt = { id: string; name: string; signedAt: string; signature: string };

function fireConfetti() {
  const colors = ["#c9a227", "#ecd27a", "#8f1d1d", "#ece3cf"];
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors }), 250);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors }), 400);
}

export default function SignatureForm() {
  const { character } = useCharacter();
  const sigRef = useRef<SignatureCanvas>(null);
  const [name, setName] = useState(character?.name ? `${character.name} ` : "");
  const [accepted, setAccepted] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const canSubmit = name.trim().length >= 2 && accepted && hasDrawn && !submitting;

  function clearSignature() {
    sigRef.current?.clear();
    setHasDrawn(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !sigRef.current) return;
    setSubmitting(true);
    setError(null);
    const signature = sigRef.current.getCanvas().toDataURL("image/png");
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), signature, character: character?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ukendt fejl");
      setReceipt({ ...data, signature });
      fireConfetti();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt. Prøv igen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    const signedAt = new Date(receipt.signedAt).toLocaleString("da-DK", {
      dateStyle: "long",
      timeStyle: "short",
    });
    return (
      <section className="relative mt-12 text-center">
        <p className="font-display text-xs tracking-[0.35em] text-gold-dim uppercase">
          Kvittering nr. {receipt.id}
        </p>
        {character && (
          <div className="mt-6 flex justify-center">
            <PixelSprite character={character} scale={5} />
          </div>
        )}
        <h2 className="gold-text mt-4 font-display text-2xl font-black uppercase sm:text-4xl">
          Du er nu bundet til festen
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg italic text-parchment/80">
          {receipt.name}
          {character ? ` (${character.title})` : ""} har den {signedAt} uigenkaldeligt frasagt sig enhver
          ret til at klage. Der er ingen vej tilbage.
        </p>
        <div className="relative mx-auto mt-8 max-w-sm border border-gold/50 bg-parchment p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={receipt.signature} alt={`Underskrift af ${receipt.name}`} className="mx-auto h-28 w-auto" />
          <div className="stamp pointer-events-none absolute right-2 bottom-2 px-3 py-1 font-display text-sm font-bold tracking-widest uppercase sm:right-4 sm:text-base">
            Bindende
          </div>
        </div>
        <p className="mt-2 font-display text-xs tracking-widest text-parchment/60 uppercase">
          {receipt.name}
        </p>
        <p className="mt-10 font-display text-sm tracking-[0.3em] text-blood uppercase">
          Hvad der sker på Destinationen, bliver på Destinationen
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12 space-y-8">
      <h2 className="text-center font-display text-xl tracking-[0.2em] text-gold uppercase sm:text-2xl">
        Underskrift
      </h2>

      <div>
        <label htmlFor="name" className="block font-display text-xs tracking-[0.25em] text-gold-light uppercase">
          Den Undertegnedes fulde navn
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fornavn Mellemnavn Efternavn"
          className="mt-2 w-full border-0 border-b border-gold/50 bg-transparent px-1 py-2 text-xl text-parchment placeholder:text-parchment/30 focus:border-gold focus:ring-0 focus:outline-none"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-lg text-parchment/90">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1.5 h-5 w-5 shrink-0 accent-gold"
        />
        <span>
          Jeg har læst, forstået og accepterer vilkårene i §1–§8, og jeg erkender,
          at jeg ikke har læst dem.
        </span>
      </label>

      <div>
        <div className="flex items-end justify-between">
          <span className="font-display text-xs tracking-[0.25em] text-gold-light uppercase">
            Digital underskrift
          </span>
          <button
            type="button"
            onClick={clearSignature}
            disabled={!hasDrawn}
            className="font-display text-xs tracking-widest text-parchment/60 uppercase underline-offset-4 hover:text-gold hover:underline disabled:opacity-30"
          >
            Ryd
          </button>
        </div>
        <div className="relative mt-2 border border-gold/50 bg-parchment">
          <SignatureCanvas
            ref={sigRef}
            penColor="#1a1408"
            minWidth={1}
            maxWidth={2.8}
            onEnd={() => setHasDrawn(true)}
            canvasProps={{ className: "block h-48 w-full sm:h-56", "aria-label": "Underskriftsfelt" }}
          />
          <div className="pointer-events-none absolute right-6 bottom-10 left-6 border-b border-dashed border-ink/30" />
          <span className="pointer-events-none absolute bottom-3 left-6 font-display text-[0.65rem] tracking-widest text-ink/40 uppercase">
            ✗ Underskriv her
          </span>
          {!accepted && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/80 p-4 text-center font-display text-sm tracking-wider text-gold-light uppercase backdrop-blur-[1px]">
              Accepter vilkårene for at underskrive
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-center text-lg text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full border border-gold bg-gradient-to-b from-gold-light via-gold to-gold-dim py-4 font-display text-lg font-bold tracking-[0.3em] text-ink uppercase shadow-[0_0_30px_rgba(201,162,39,0.25)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
      >
        {submitting ? "Forsegler…" : "Underskriv"}
      </button>
    </form>
  );
}
