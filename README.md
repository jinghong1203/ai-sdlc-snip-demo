# Snip — URL Shortener

One backend, two clients. Each layer lives on its own branch and is
mounted here as a git submodule so the superproject always pins the
exact commit of each piece.

```
superproject (main)
├── backend/   ← branch: backend   Bun HTTP server, zero npm deps
├── frontend/  ← branch: frontend  Angular UI, lovable.dev-inspired dark design
└── cli/       ← branch: cli       Node.js CLI, zero npm deps
```

---

## Architecture

The backend is the single source of truth. Both the Angular frontend and
the Node CLI talk to it over HTTP.

```
Browser  ──►  Angular app  ──►  Bun backend  ──►  in-memory Map
Terminal ──►  Node CLI     ──►       ↑
```

---

## API contract

| Method | Path         | Body                    | Status | Response                                          |
|--------|--------------|-------------------------|--------|---------------------------------------------------|
| POST   | `/api/links` | `{ "url": "https://…" }` | 201   | `{ code, url, shortUrl, hits, createdAt }` |
| GET    | `/api/links` | —                       | 200    | array of all links (same shape)                   |
| GET    | `/:code`     | —                       | 302    | `Location:` original URL; hits incremented        |
| ANY    | —            | —                       | 400/404| `{ "error": "…" }` on bad input or unknown code  |

All endpoints return open CORS headers; `OPTIONS` preflight returns 204.

Short codes are 6 random base-62 characters. `BASE_URL` (used in `shortUrl`)
defaults to `http://localhost:3000` and can be overridden via env var (see
`backend/README.md`).

---

## Branch & submodule layout

| Submodule  | Tracks branch | Key files                              |
|------------|---------------|----------------------------------------|
| `backend/` | `backend`     | `server.js`, `package.json`            |
| `frontend/`| `frontend`    | `snip-frontend/` (Angular app), `design.md` |
| `cli/`     | `cli`         | `cli.js`, `package.json`, `snip[.cmd/.ps1]` |

Each submodule is an independent git orphan branch of this same repository,
so a single `git clone --recurse-submodules` fetches the whole project.

---

## Cloning

> **Warning:** a plain `git clone` leaves `backend/`, `frontend/`, and `cli/`
> as **empty directories**. Always recurse submodules:

```bash
git clone --recurse-submodules https://github.com/jinghong1203/ai-sdlc-snip-demo.git
cd ai-sdlc-snip-demo
```

After a plain clone you can still initialise them:

```bash
git submodule update --init --recursive
```

---

## Running all three pieces

### 1 — Backend (Bun)

```bash
cd backend
bun run server.js          # listens on PORT (default 3000)
# or: bun start
```

Environment variables: `PORT`, `BASE_URL`, `PUBLIC_DIR`, `RAILWAY_PUBLIC_DOMAIN`
(see `backend/README.md`).

### 2 — Frontend (Angular)

```bash
cd frontend/snip-frontend
npm install
npx ng serve               # dev server → http://localhost:4200
```

Start the backend first; the Angular app calls `http://localhost:3000` by
default (change the `API` constant in `src/app/app.ts` for other setups).

To build for production:

```bash
npx ng build               # output → dist/snip-frontend/
```

### 3 — CLI (Node.js)

```bash
cd cli

node cli.js help           # show usage

# Shorten a URL
node cli.js add https://example.com

# List all links
node cli.js ls

# Open a short link in your browser
node cli.js open <code>
```

No `npm install` required — zero npm dependencies.  
Set `SNIP_API=http://your-host:port` to target a non-local backend.

---

## Submodule update workflow

When a layer branch receives new commits, advance the superproject pointer:

```bash
# ── Inside a submodule ───────────────────────────────────────────────────
cd backend                          # or frontend, or cli
git add .
git commit -m "your change"
git push                            # pushes to origin/<branch>

# ── Back in the superproject ─────────────────────────────────────────────
cd ..                               # snip-demo root
git submodule update --remote backend   # advance pointer to latest branch tip
git add backend
git commit -m "chore: bump backend submodule"
git push
```

To pull all submodule updates in one step:

```bash
git submodule update --remote --merge
git add backend frontend cli
git commit -m "chore: bump all submodules"
git push
```
