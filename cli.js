#!/usr/bin/env node
'use strict';

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');

// ── Helpers ──────────────────────────────────────────────────────────────────

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

async function apiFetch(path, opts) {
  try {
    return await fetch(BASE + path, opts);
  } catch (e) {
    die(`Cannot reach backend (${BASE}): ${e.message}`);
  }
}

/**
 * Follow one redirect manually using the built-in http/https module and
 * return the Location header string, null on 404, or throw on other errors.
 *
 * Note: global fetch with redirect:'manual' returns an opaque-redirect
 * response whose Location header is inaccessible per the WHATWG spec, so
 * we use the built-in http/https module instead.
 */
function resolveRedirect(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    const req = mod.get(url, res => {
      res.resume(); // discard body
      const { statusCode, headers } = res;
      if (statusCode >= 300 && statusCode < 400) return resolve(headers.location ?? null);
      if (statusCode === 404) return resolve(null);
      reject(new Error(`Unexpected status ${statusCode} from ${url}`));
    });
    req.on('error', reject);
  });
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');

  const res = await apiFetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    die(`Error ${res.status}: ${data.error || res.statusText}`);
  }

  const link = await res.json();
  console.log(link.shortUrl);
}

async function cmdLs() {
  const res = await apiFetch('/api/links');
  if (!res.ok) die(`Error ${res.status}: ${res.statusText}`);

  const links = await res.json();
  if (!links.length) {
    console.log('No links yet.');
    return;
  }

  const cW = Math.max('CODE'.length, ...links.map(l => l.code.length));
  const hW = Math.max('HITS'.length, ...links.map(l => String(l.hits).length));
  const rule = n => '─'.repeat(n);

  console.log(`${'CODE'.padEnd(cW)}  ${'HITS'.padStart(hW)}  URL`);
  console.log(`${rule(cW)}  ${rule(hW)}  ─────`);
  for (const l of links) {
    console.log(`${l.code.padEnd(cW)}  ${String(l.hits).padStart(hW)}  ${l.url}`);
  }
}

async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  let location;
  try {
    location = await resolveRedirect(`${BASE}/${code}`);
  } catch (e) {
    die(`Cannot reach backend (${BASE}): ${e.message}`);
  }

  if (location == null) die(`Unknown code: ${code}`);

  const { spawn } = require('child_process');
  const [cmd, args] =
    process.platform === 'win32'  ? ['cmd',      ['/c', 'start', '', location]] :
    process.platform === 'darwin' ? ['open',     [location]] :
                                    ['xdg-open', [location]];

  spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  console.log(location);
}

function usage() {
  console.log(`\
Snip CLI — URL shortener client

Usage:
  snip add <url>    Shorten a URL; prints the short URL
  snip ls           List all links — code, hits, original URL
  snip open <code>  Open a link's destination in your default browser
  snip help         Show this help

Environment:
  SNIP_API  Backend base URL  (default: http://localhost:3000)\
`);
}

// ── Entry ─────────────────────────────────────────────────────────────────────

async function main() {
  const [, , cmd, arg] = process.argv;
  switch (cmd) {
    case 'add':     return cmdAdd(arg);
    case 'ls':      return cmdLs();
    case 'open':    return cmdOpen(arg);
    case 'help':
    case undefined: return usage();
    default:
      process.stderr.write(`Unknown command: ${cmd}\n\n`);
      usage();
      process.exit(1);
  }
}

main().catch(e => {
  process.stderr.write(`${e.message}\n`);
  process.exit(1);
});
