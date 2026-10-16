import Image from "next/image";
import Game, { PlayerBanner } from "@/components/Game";
import SignatureForm from "@/components/SignatureForm";
import billede from "@/public/julefrokost-billede.jpg";

const paragraphs: { title: string; body: string[] }[] = [
  {
    title: "Formål og omfang",
    body: [
      "Nærværende ansvarsfraskrivelse (herefter »Dokumentet«) regulerer forholdet mellem Arrangørerne og Deltageren (herefter »Den Undertegnede«) i forbindelse med julefrokosten afholdt anno 2026 på en af Arrangørerne valgt, hemmeligholdt lokation (herefter henholdsvis »Destinationen« og »Begivenheden«). Destinationen oplyses først, når det er for sent at fortryde.",
      "Dokumentet træder i kraft ved underskrift og ophører først, når den sidste deltager har genvundet fuld hukommelse, hvilket Arrangørerne ikke forventer sker.",
    ],
  },
  {
    title: "Risikoerkendelse",
    body: [
      "Den Undertegnede erkender, at Begivenheden kan indebære risiko for, men ikke begrænset til: tømmermænd af bibelske proportioner, akut tab af værdighed, spontan dansegulvsaktivitet, uforklarlige blå mærker samt kontakt med lokale spiritusvarianter, hvis alkoholprocent Arrangørerne hverken kender eller ønsker at kende.",
      "Arrangørerne fraskriver sig ethvert ansvar for følgevirkninger heraf, herunder fysiske, psykiske, økonomiske og sociale – sidstnævnte særligt i relation til gruppechatten.",
    ],
  },
  {
    title: "Hukommelse og dokumentation",
    body: [
      "Den Undertegnede accepterer, at hukommelsen fra og med kl. 23:00 lokal tid kan være fragmenteret, fraværende eller direkte opdigtet.",
      "Billed- og videomateriale optaget under Begivenheden tilhører fællesskabet og kan til enhver tid anvendes som pressionsmiddel, bryllupstale eller lignende.",
    ],
  },
  {
    title: "Mystiske kvitteringer",
    body: [
      "Kvitteringer, kontoudtog og MobilePay-anmodninger, der dukker op i dagene efter Begivenheden, er Den Undertegnedes eget ansvar – uanset beløb, valuta eller om Den Undertegnede kan redegøre for etablissementets navn.",
      "Arrangørerne kan ikke stilles til ansvar for valutakursen, valutaens navn eller for den omstændighed, at »det virkede billigt på det tidspunkt«.",
    ],
  },
  {
    title: "Tavshedspligt",
    body: [
      "Hvad der sker på Destinationen, bliver på Destinationen. Den Undertegnede pålægges ubetinget tavshedspligt over for partnere, forældre, kolleger, svigerfamilie og øvrige uvedkommende.",
      "Tavshedspligten gælder livet ud og arves af eventuelle efterkommere.",
    ],
  },
  {
    title: "Adfærdsregler",
    body: [
      "Den, der først forlader festen, skylder næste omgang. Den, der falder i søvn, accepterer at blive dekoreret. Den, der siger »jeg tager bare én til«, binder sig hermed juridisk til mindst tre.",
      "Taler om kryptovaluta, ekskærester og personlige rekorder i bænkpres er forbudt efter kl. 01:00.",
    ],
  },
  {
    title: "Force majeure",
    body: [
      "Arrangørerne hæfter ikke for forsinkelser eller aflysninger forårsaget af naturkatastrofer, flystrejker, lokal folklore, uventede nationale helligdage eller deltagere, der »lige skulle noget«.",
    ],
  },
  {
    title: "Værneting og lovvalg",
    body: [
      "Eventuelle tvister afgøres endeligt og uden ankemulighed af gruppens ældste deltager, efter at denne har indtaget mindst to øl. Afgørelsen kan ikke prøves ved danske, udenlandske eller internationale domstole – herunder domstolene på Destinationen, hvis eksistens hverken kan be- eller afkræftes.",
    ],
  },
];

export default function Home() {
  return (
    <Game>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <article className="document-frame relative bg-coal/80 px-5 py-10 sm:px-12 sm:py-14">
          <PlayerBanner />
          <header className="text-center">
            <p className="font-display text-[0.7rem] tracking-[0.35em] text-gold-dim uppercase sm:text-xs">
              Dokument nr. XXX-2026-XMAS · Fortroligt
            </p>
            <div className="ornament-rule mt-6 text-xl" aria-hidden>
              ✠
            </div>
            <h1 className="gold-text mt-6 font-display text-[clamp(1.2rem,5.4vw,3rem)] leading-tight font-black uppercase sm:tracking-wide">
              Ansvarsfraskrivelse
            </h1>
            <p className="mt-3 font-display text-base tracking-[0.25em] text-gold-light uppercase sm:text-xl">
              Julefrokost Anno 2026
            </p>
            <p className="mt-2 font-display text-xs tracking-[0.3em] text-parchment/60 uppercase">
              Destination: ██████████ · Klassificeret
            </p>
            <div className="ornament-rule mt-6 text-xl" aria-hidden>
              ✠
            </div>
            <p className="mx-auto mt-8 max-w-xl text-lg italic text-parchment/80">
              Deltagelse sker udelukkende på eget ansvar. Læs nærværende
              dokument omhyggeligt – eller lad være, det ændrer intet.
            </p>
          </header>

          <figure className="mt-12">
            <div className="border border-gold/60 p-1.5 shadow-[0_0_40px_rgba(201,162,39,0.15)] sm:p-2">
              <Image
                src={billede}
                alt="De ansvarsfrie deltagere samlet ved det sidste måltid før afrejse til en ukendt destination"
                placeholder="blur"
                priority
                sizes="(max-width: 768px) 100vw, 720px"
                className="h-auto w-full sepia-[0.15]"
              />
            </div>
            <figcaption className="mt-3 text-center">
              <span className="font-display text-xs tracking-[0.3em] text-gold uppercase">
                Bilag A
              </span>
              <span className="mt-1 block italic text-parchment/60">
                Deltagerne, fotograferet forud for Begivenheden. Sidste kendte
                tilstand af fuld værdighed.
              </span>
            </figcaption>
          </figure>

          <section className="mt-12 space-y-10">
            {paragraphs.map((p, i) => (
              <div key={p.title}>
                <h2 className="flex items-baseline gap-3 font-display text-lg text-gold sm:text-xl">
                  <span className="text-gold-light">§{i + 1}</span>
                  <span className="tracking-wider uppercase">{p.title}</span>
                </h2>
                <div className="mt-3 space-y-3 border-l border-gold/30 pl-4 text-[1.08rem] leading-relaxed text-parchment/90 sm:pl-6 sm:text-lg">
                  {p.body.map((text, j) => (
                    <p key={j}>
                      <span className="mr-2 font-display text-sm text-gold-dim">
                        stk. {j + 1}.
                      </span>
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <div className="ornament-rule mt-14 text-xl" aria-hidden>
            ✠
          </div>

          <SignatureForm />

          <footer className="mt-12 text-center text-xs italic text-parchment/40">
            Dette dokument har ingen som helst juridisk gyldighed. Det har til
            gengæld enorm moralsk gyldighed.
          </footer>
        </article>
      </main>
    </Game>
  );
}
