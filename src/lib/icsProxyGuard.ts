/**
 * Allowed hosts for api/ics-proxy.ts. Without this check the proxy would be
 * an open server-side fetcher for any https URL on the internet — anyone
 * could point it at an internal/private address (SSRF) or just abuse it as
 * a free CORS proxy for unrelated sites. Restricting it to EcoleDirecte's
 * own domain keeps it doing exactly one job.
 */
const ALLOWED_BASE_DOMAIN = "ecoledirecte.com";

export interface IcsUrlCheck {
  ok: boolean;
  error?: string;
}

export function checkIcsUrl(raw: string | null): IcsUrlCheck {
  if (!raw) return { ok: false, error: 'Paramètre "url" manquant.' };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "URL invalide." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "L'URL doit être en https." };
  }

  // Exact match or a true subdomain only — "ecoledirecte.com" or
  // "api.ecoledirecte.com", never "notecoledirecte.com" or
  // "ecoledirecte.com.evil.example" (a bare endsWith() on the suffix would
  // wrongly allow both of those).
  const host = url.hostname.toLowerCase();
  const allowed = host === ALLOWED_BASE_DOMAIN || host.endsWith(`.${ALLOWED_BASE_DOMAIN}`);
  if (!allowed) {
    return { ok: false, error: "Seuls les liens ecoledirecte.com sont acceptés." };
  }

  return { ok: true };
}
