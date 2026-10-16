# The Legend of Julefrokost – Ansvarsfraskrivelse 2026

Et lille 16-bit-spil (Next.js App Router + TypeScript + Tailwind), hvor man vælger helt,
betaler 2.700 kr. til Arrangøren, flyver til en ukendt destination og klarer opgavelisten: bund en øl, det låste rum (puslespil),
Airbnb-check-in (kode), middag & cocktails (grib maden og drinksene) og til sidst diskoteket, hvor Julemanden har ansvarsfraskrivelsen.

- Helte, egenskaber og udseende: `lib/characters.ts`
- Paragrafferne: `lib/waiver.ts`
- Opgavelisten: `lib/quests.ts`
- Betalingen før afgang: `components/game/Payment.tsx`
- Minispil: `components/game/Chug.tsx`, `Puzzle.tsx`, `Keypad.tsx`, `Dinner.tsx`
- Spilverdenen (kort, hændelser, dialoger): `components/game/World.tsx`
- Intro-filmen: `components/game/Cutscene.tsx`

## Lokalt
    npm install
    npm run dev        # http://localhost:3000

## Deploy
    npx vercel         # preview
    npx vercel --prod  # produktion

## Gem underskrifter (valgfrit)
Uden opsætning logges hver underskrift i Vercel → Project → Logs (søg på `[UNDERSKRIFT]`).
Vil du gemme dem: Vercel → Project → Storage → tilføj **Upstash Redis** (Marketplace) og redeploy.
Sæt evt. `ADMIN_KEY` i Environment Variables og se listen på `/api/sign?key=<ADMIN_KEY>`.
