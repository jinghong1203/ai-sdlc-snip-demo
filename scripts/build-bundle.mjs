#!/usr/bin/env node
/**
 * scripts/build-bundle.mjs
 *
 * Assembles the production bundle submodule from the three source branches.
 * Usage (from superproject root):
 *   node scripts/build-bundle.mjs           # assemble + commit locally
 *   node scripts/build-bundle.mjs --push    # also push bundle branch + main
 *
 * Safe to run repeatedly: commits are skipped when nothing changed.
 * Works on Windows, macOS, Linux, and CI (Node ≥ 18, zero npm deps).
 */

import { execSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

const PUSH       = argv.includes('--push');
const ROOT       = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE     = join(ROOT, 'bundle');
const FE_APP     = join(ROOT, 'frontend', 'snip-frontend');
const BROWSER    = join(FE_APP, 'dist', 'snip-frontend', 'browser');

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
  } catch {
    console.error(`\n✗ Failed: ${cmd}`);
    process.exit(1);
  }
}

/** true when the given git repo has staged changes ready to commit. */
function hasStagedChanges(dir) {
  return spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: dir }).status !== 0;
}

// ── 1. Update source submodules ───────────────────────────────────────────────
console.log('\n══ 1/5  Updating source submodules ══');
run('git submodule update --init --remote backend frontend cli', { cwd: ROOT });

// ── 2. Build Angular frontend ─────────────────────────────────────────────────
console.log('\n══ 2/5  Building Angular frontend ══');
run('npm install', { cwd: FE_APP });
run('npx ng build', { cwd: FE_APP });

const INDEX = join(BROWSER, 'index.html');
if (!existsSync(INDEX)) {
  console.error(`\n✗ Build output missing: ${INDEX}`);
  process.exit(1);
}

// ── 3. Assemble bundle/ ───────────────────────────────────────────────────────
console.log('\n══ 3/5  Assembling bundle/ ══');

// Fresh public/ — always rebuilt from the authoritative build output
if (existsSync(join(BUNDLE, 'public'))) {
  rmSync(join(BUNDLE, 'public'), { recursive: true, force: true });
}
mkdirSync(join(BUNDLE, 'public'), { recursive: true });

// Source files — copied as-is from their branches
cpSync(join(ROOT, 'backend', 'server.js'), join(BUNDLE, 'server.js'));
cpSync(join(ROOT, 'cli',     'cli.js'),    join(BUNDLE, 'cli.js'));

// Angular build output → public/
cpSync(BROWSER, join(BUNDLE, 'public'), { recursive: true });

// .env — Bun auto-loads this; tells server.js where to find the UI assets
writeFileSync(join(BUNDLE, '.env'), 'PUBLIC_DIR=./public\n');

// package.json — no "type" field so cli.js runs under plain node too
writeFileSync(
  join(BUNDLE, 'package.json'),
  JSON.stringify(
    { name: 'snip', version: '1.0.0', scripts: { start: 'bun server.js' } },
    null, 2,
  ) + '\n',
);

// Dockerfile
writeFileSync(join(BUNDLE, 'Dockerfile'), [
  'FROM oven/bun:1-alpine',
  'WORKDIR /app',
  'COPY . .',
  'ENV PORT=3000',
  'EXPOSE 3000',
  'CMD bun server.js',
  '',
].join('\n'));

// .dockerignore
writeFileSync(join(BUNDLE, '.dockerignore'), [
  'node_modules',
  '.git',
  '',
].join('\n'));

// railway.json — selects the Dockerfile builder
writeFileSync(
  join(BUNDLE, 'railway.json'),
  JSON.stringify(
    {
      $schema: 'https://railway.com/railway.schema.json',
      build:  { builder: 'DOCKERFILE' },
      deploy: { restartPolicyType: 'ON_FAILURE' },
    },
    null, 2,
  ) + '\n',
);

// .gitignore for the bundle repo itself
writeFileSync(join(BUNDLE, '.gitignore'), 'node_modules/\n');

// ── 4. Commit inside bundle/ ──────────────────────────────────────────────────
console.log('\n══ 4/5  Committing bundle/ ══');
run('git add -A', { cwd: BUNDLE });

if (hasStagedChanges(BUNDLE)) {
  run('git commit -m "chore: build bundle"', { cwd: BUNDLE });
  console.log('bundle/: committed.');
} else {
  console.log('bundle/: nothing to commit — already up to date.');
}

if (PUSH) {
  // HEAD:bundle works whether HEAD is on a branch or detached
  run('git push origin HEAD:bundle', { cwd: BUNDLE });
}

// ── 5. Bump superproject pointer ──────────────────────────────────────────────
console.log('\n══ 5/5  Bumping superproject pointer ══');
run('git add bundle', { cwd: ROOT });

if (hasStagedChanges(ROOT)) {
  run('git commit -m "chore: bump bundle submodule"', { cwd: ROOT });
  console.log('superproject: bundle pointer bumped.');
} else {
  console.log('superproject: bundle pointer unchanged — nothing to commit.');
}

if (PUSH) {
  run('git push', { cwd: ROOT });
}

console.log('\n✓ Done.');
