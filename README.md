# Ansvarsfraskrivelse – Julefrokost Anno 2026

Next.js (App Router) + TypeScript + Tailwind.

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
