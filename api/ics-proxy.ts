import { checkIcsUrl } from "../src/lib/icsProxyGuard";

/**
 * Stateless CORS proxy for EcoleDirecte's iCal feed — the one server-side
 * piece in an otherwise fully client-side app. It exists only because
 * EcoleDirecte's feed can't be fetched directly from a browser (no CORS
 * headers for third-party origins), the way Google Calendar fetches a
 * "subscribe by URL" feed from its own servers. This does the same job:
 * fetch the feed server-side, hand the raw text back. It stores nothing,
 * logs nothing beyond Vercel's standard request logs, and only ever
 * forwards to ecoledirecte.com (see icsProxyGuard) — never an arbitrary URL.
 */
export const config = { runtime: "edge" };

const UPSTREAM_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 5_000_000; // 5 MB — a school-year calendar is a few hundred KB at most

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return json(405, { error: "Méthode non supportée." });
  }

  const target = new URL(req.url).searchParams.get("url");
  const check = checkIcsUrl(target);
  if (!check.ok) {
    return json(400, { error: check.error });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target!, {
      headers: { accept: "text/calendar, text/plain, */*" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      redirect: "follow",
    });
  } catch {
    return json(502, {
      error: "Impossible de contacter EcoleDirecte (hors ligne ou trop long à répondre).",
    });
  }

  if (!upstream.ok) {
    return json(502, { error: `EcoleDirecte a répondu avec une erreur (${upstream.status}).` });
  }

  const text = await upstream.text();
  if (text.length > MAX_RESPONSE_BYTES) {
    return json(502, { error: "Le calendrier renvoyé par EcoleDirecte est trop volumineux." });
  }

  return new Response(text, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
  });
}
