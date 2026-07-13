# Snip — Backend

Tiny URL shortener backend. Single-file [Bun](https://bun.sh) server, zero npm dependencies.

## Start

```bash
bun run server.js   # direct
bun start           # via package.json
```

## Environment variables

| Variable                | Default              | Description                                      |
|-------------------------|----------------------|--------------------------------------------------|
| `PORT`                  | `3000`               | HTTP port                                        |
| `BASE_URL`              | auto                 | Origin prepended to short codes in `shortUrl`    |
| `RAILWAY_PUBLIC_DOMAIN` | —                    | Detected automatically on Railway deployments    |
| `PUBLIC_DIR`            | —                    | Optional path to a folder of static assets       |

`BASE_URL` resolution order:
1. `BASE_URL` env var
2. `https://$RAILWAY_PUBLIC_DOMAIN` (when that var is present)
3. `http://localhost:$PORT`

When `PUBLIC_DIR` is set, static files are served and take priority over short-code
lookups. `GET /` maps to `index.html` inside that folder.

## API

### `POST /api/links`

Shorten a URL.

```
Body  → { "url": "https://example.com" }
201   ← { code, url, shortUrl, hits, createdAt }
400   ← invalid JSON or non-http(s) URL
```

### `GET /api/links`

List every shortened link.

```
200 ← [{ code, url, shortUrl, hits, createdAt }, …]
```

### `GET /:code`

Redirect to the original URL (increments `hits`).

```
302 ← Location: <original URL>
404 ← unknown code
```

All endpoints expose open CORS headers and respond to `OPTIONS` pre-flight requests.
