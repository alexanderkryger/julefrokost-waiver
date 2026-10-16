import { NextResponse } from "next/server";

// Valgfri lagring: Hvis et Upstash Redis-lager er tilknyttet via Vercel Marketplace,
// sætter Vercel automatisk KV_REST_API_URL / KV_REST_API_TOKEN (eller UPSTASH_*).
// Uden dem logges underskrifterne blot (synlige under "Logs" i Vercel-dashboardet).
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "julefrokost:signatures";
const MAX_SIGNATURE_BYTES = 500_000;

async function redis(command: (string | number)[]) {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return (await res.json()).result;
}

export async function POST(req: Request) {
  let body: { name?: unknown; signature?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørgsel." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const signature = typeof body.signature === "string" ? body.signature : "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Angiv dit fulde navn." }, { status: 400 });
  }
  if (!signature.startsWith("data:image/png;base64,") || signature.length > MAX_SIGNATURE_BYTES) {
    return NextResponse.json({ error: "Ugyldig underskrift." }, { status: 400 });
  }

  const record = {
    id: `XMAS-${Date.now().toString(36).toUpperCase()}`,
    name,
    signedAt: new Date().toISOString(),
  };

  console.log("[UNDERSKRIFT]", JSON.stringify(record));

  if (REDIS_URL && REDIS_TOKEN) {
    try {
      await redis(["LPUSH", KEY, JSON.stringify({ ...record, signature })]);
    } catch (err) {
      console.error("Kunne ikke gemme i Redis:", err);
    }
  }

  return NextResponse.json(record);
}

// Se hvem der har skrevet under: GET /api/sign?key=<ADMIN_KEY>
// Kræver både Redis-lager og miljøvariablen ADMIN_KEY.
export async function GET(req: Request) {
  const adminKey = process.env.ADMIN_KEY;
  const key = new URL(req.url).searchParams.get("key");
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ error: "Adgang nægtet." }, { status: 401 });
  }
  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ error: "Intet lager tilknyttet – tjek Vercel-loggene." }, { status: 501 });
  }
  const raw: string[] = await redis(["LRANGE", KEY, 0, -1]);
  const signatures = raw.map((r) => {
    const { id, name, signedAt } = JSON.parse(r);
    return { id, name, signedAt };
  });
  return NextResponse.json({ count: signatures.length, signatures });
}
