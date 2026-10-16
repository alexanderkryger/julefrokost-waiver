# The Legend of Julefrokost – Ansvarsfraskrivelse 2026

Et lille 16-bit-spil (Next.js App Router + TypeScript + Tailwind), hvor man vælger helt,
flyver til en ukendt destination, bunder en øl og underskriver ansvarsfraskrivelsen på diskoteket.

- Helte, egenskaber og udseende: `lib/characters.ts`
- Paragrafferne: `lib/waiver.ts`
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
