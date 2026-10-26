/**
 * CSP violation collector (report-uri target set in next.config.ts).
 *
 * Logs one compact line per violation so Report-Only rollout can be reviewed
 * in the Netlify function logs before switching CSP_MODE=enforce.
 * Unauthenticated by design (browsers send these without credentials), so the
 * body is size-capped and only a fixed set of fields is logged.
 */
import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 16 * 1024;

// Violations caused by browser extensions, not by the app
const NOISE = /^(chrome|moz|safari|safari-web)-extension:/;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  // report-uri sends { "csp-report": {...} }; the Reporting API sends an array
  const reports: any[] = Array.isArray(body)
    ? body.map((r) => r?.body)
    : [body?.["csp-report"]];

  for (const r of reports) {
    if (!r) continue;
    const blocked = r["blocked-uri"] ?? r.blockedURL ?? "";
    const source = r["source-file"] ?? r.sourceFile ?? "";
    if (NOISE.test(blocked) || NOISE.test(source)) continue;

    console.warn(
      "[csp]",
      JSON.stringify({
        directive: r["effective-directive"] ?? r.effectiveDirective,
        blocked,
        page: r["document-uri"] ?? r.documentURL,
        source,
        disposition: r.disposition,
      }),
    );
  }

  return new NextResponse(null, { status: 204 });
}
