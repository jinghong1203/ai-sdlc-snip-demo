import { join, resolve, sep } from "node:path";

// ── Config ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3000", 10);
const BASE_URL =
  process.env.BASE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : null;

// ── Code generation ──────────────────────────────────────────────────────────
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateCode(len = 6) {
  let code = "";
  while (code.length < len) {
    // Over-sample; 248 = 4 × 62 eliminates modulo bias
    const bytes = crypto.getRandomValues(new Uint8Array(len * 2));
    for (const b of bytes) {
      if (code.length === len) break;
      if (b < 248) code += BASE62[b % 62];
    }
  }
  return code;
}

// ── Response helpers ─────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

// ── Static file serving ──────────────────────────────────────────────────────
async function tryStatic(pathname) {
  if (!PUBLIC_DIR) return null;

  // Strip empties, single-dots, and traversal segments
  const parts = pathname.split("/").filter((p) => p && p !== "." && p !== "..");
  const rel = parts.length ? parts.join("/") : "index.html";
  const full = resolve(join(PUBLIC_DIR, rel));

  // Defence-in-depth: resolved path must stay inside PUBLIC_DIR
  const guard = PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : PUBLIC_DIR + sep;
  if (!full.startsWith(guard)) return null;

  const file = Bun.file(full);
  return (await file.exists())
    ? new Response(file, { headers: { ...CORS_HEADERS } })
    : null;
}

// ── In-memory store ──────────────────────────────────────────────────────────
/** @type {Map<string, {code:string, url:string, shortUrl:string, hits:number, createdAt:string}>} */
const links = new Map();

// ── Server ───────────────────────────────────────────────────────────────────
Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method.toUpperCase();

    // CORS pre-flight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
    }

    // POST /api/links — shorten a URL
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
      }

      const raw = body?.url;
      if (typeof raw !== "string" || !raw) {
        return jsonResponse({ error: "url field required" }, 400);
      }

      let parsed;
      try {
        parsed = new URL(raw);
      } catch {
        return jsonResponse({ error: "Invalid URL" }, 400);
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return jsonResponse({ error: "URL must use http or https protocol" }, 400);
      }

      let code;
      do {
        code = generateCode();
      } while (links.has(code));

      const link = {
        code,
        url: raw,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return jsonResponse(link, 201);
    }

    // GET /api/links — list all links
    if (method === "GET" && pathname === "/api/links") {
      return jsonResponse([...links.values()]);
    }

    // GET * — static files win over short codes
    if (method === "GET") {
      const staticRes = await tryStatic(pathname);
      if (staticRes) return staticRes;

      const code = pathname.slice(1); // strip leading "/"
      if (code) {
        const link = links.get(code);
        if (link) {
          link.hits++;
          return new Response(null, {
            status: 302,
            headers: { Location: link.url, ...CORS_HEADERS },
          });
        }
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
});

console.log(`Snip running → ${BASE_URL}  (port ${PORT})`);
