# Snip CLI

Zero-dependency Node.js CLI client for the Snip URL shortener.  
Requires Node ≥ 18 (uses global `fetch` and `http`/`https` built-ins — no npm install needed).

## Quick start

```bash
# Run directly
node cli.js help

# Or use a wrapper (no global install required)
./snip help          # Unix
snip.cmd help        # Windows CMD
./snip.ps1 help      # PowerShell

# Install globally
npm install -g .
snip help
```

## Commands

| Command          | Description                                      |
|------------------|--------------------------------------------------|
| `snip add <url>` | Shorten a URL; prints the short URL              |
| `snip ls`        | List all links — aligned code / hits / URL table |
| `snip open <code>` | Open a link's destination in your default browser |
| `snip help`      | Show help text                                   |

## Environment

| Variable   | Default                   | Description         |
|------------|---------------------------|---------------------|
| `SNIP_API` | `http://localhost:3000`   | Backend base URL    |

## Examples

```
$ snip add https://example.com
http://localhost:3000/aB3xY7

$ snip ls
CODE    HITS  URL
──────  ────  ─────────────────────────
aB3xY7     3  https://example.com

$ snip open aB3xY7
https://example.com
```

Errors (bad input, unknown code, unreachable backend) print to stderr and exit 1.
