#!/usr/bin/env node

import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const skillRoot = join(root, 'plugins', 'security-engineering', 'skills', 'develop-securely');
const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
const threatModeling = await readFile(join(skillRoot, 'references', 'threat-modeling.md'), 'utf8');
const secureCoding = await readFile(join(skillRoot, 'references', 'secure-coding-checklist.md'), 'utf8');
const agenticSecurity = await readFile(join(skillRoot, 'references', 'agentic-ai-security.md'), 'utf8');
const reviewAndTriage = await readFile(join(skillRoot, 'references', 'review-and-triage.md'), 'utf8');
const plainLanguage = await readFile(join(skillRoot, 'references', 'plain-language-reporting.md'), 'utf8');

for (const phrase of [
  'name: develop-securely',
  '**Determine the reporting mode.**',
  'Default to plain-language mode when the signal is ambiguous',
  'lethal trifecta',
  'do not fix a security-critical finding without authorization',
  'never report a change as "secure"',
  'In plain-language mode, close by offering the technical report too',
]) {
  if (!skill.includes(phrase)) throw new Error(`develop-securely is missing core policy: ${phrase}`);
}

for (const phrase of [
  '### Lethal trifecta triage',
  'EchoLeak (CVE-2025-32711)',
  'Action-Selector',
  'CaMeL',
  'Capability-first threat modeling for sandboxes',
]) {
  if (!threatModeling.includes(phrase)) throw new Error(`Threat modeling reference is missing: ${phrase}`);
}

for (const phrase of [
  '## 1. Input validation',
  '## 5. Access control',
  '## Modern additions not covered by the 2010-era baseline',
  'Dependency / supply chain',
]) {
  if (!secureCoding.includes(phrase)) throw new Error(`Secure coding checklist is missing: ${phrase}`);
}

for (const phrase of [
  'the control/data-plane collapse',
  'Excessive Agency',
  'RFC 8693',
  'RFC 8707',
  'RFC 9396',
  'RFC 9449',
  "prove it can't, don't ask if it will",
]) {
  if (!agenticSecurity.includes(phrase)) throw new Error(`Agentic AI security reference is missing: ${phrase}`);
}

for (const phrase of [
  'scripts/scan-secrets.mjs <path>',
  'scripts/scan-dependencies.mjs <path>',
  'scripts/fetch-platform-alerts.mjs',
  'unverified — code review only',
]) {
  if (!reviewAndTriage.includes(phrase)) throw new Error(`Review and triage reference is missing: ${phrase}`);
}

for (const phrase of ['## When to use this mode', '## Translation table for common findings', 'gitleaks was not found on PATH']) {
  if (!plainLanguage.includes(phrase)) throw new Error(`Plain-language reporting reference is missing: ${phrase}`);
}

for (const path of [
  ['references', 'threat-modeling.md'],
  ['references', 'secure-coding-checklist.md'],
  ['references', 'agentic-ai-security.md'],
  ['references', 'review-and-triage.md'],
  ['references', 'plain-language-reporting.md'],
  ['assets', 'threat-model.md'],
  ['assets', 'security-review.md'],
  ['assets', 'plain-language-report.md'],
  ['scripts', 'scan-secrets.mjs'],
  ['scripts', 'scan-dependencies.mjs'],
  ['scripts', 'fetch-platform-alerts.mjs'],
]) {
  await access(join(skillRoot, ...path));
}

// --- Forward tests: actually run the bundled scripts against synthetic fixtures. ---
// Kept network-independent so this suite is deterministic in a sandboxed CI runner:
// no reliance on gitleaks/npm-registry/gh actually being installed, authenticated, or reachable.

const temporaryRoot = await mkdtemp(join(tmpdir(), 'agent-toolkit-security-'));
try {
  // scan-secrets.mjs: a directory with an obvious fake credential must be flagged,
  // and a clean directory must pass, regardless of whether gitleaks is present.
  const dirtyDir = join(temporaryRoot, 'dirty');
  await mkdir(dirtyDir);
  await writeFile(join(dirtyDir, 'config.txt'), `AWS_KEY=AKIA${'A'.repeat(16)}\n`);
  const dirty = spawnSync(process.execPath, [join(skillRoot, 'scripts', 'scan-secrets.mjs'), dirtyDir, '--json'], { encoding: 'utf8' });
  if (dirty.error) throw new Error(`scan-secrets.mjs failed to run: ${dirty.error.message}`);
  const dirtyReport = JSON.parse(dirty.stdout);
  if (dirtyReport.findingCount < 1) throw new Error('scan-secrets.mjs did not flag a synthetic AWS key fixture');
  if (dirty.status !== 1) throw new Error('scan-secrets.mjs did not exit 1 on findings');

  const cleanDir = join(temporaryRoot, 'clean');
  await mkdir(cleanDir);
  await writeFile(join(cleanDir, 'notes.txt'), 'nothing sensitive here\n');
  const clean = spawnSync(process.execPath, [join(skillRoot, 'scripts', 'scan-secrets.mjs'), cleanDir, '--json'], { encoding: 'utf8' });
  if (clean.error) throw new Error(`scan-secrets.mjs failed to run: ${clean.error.message}`);
  if (clean.status !== 0) throw new Error('scan-secrets.mjs did not exit 0 on a clean directory');

  const usageError = spawnSync(process.execPath, [join(skillRoot, 'scripts', 'scan-secrets.mjs'), '--bogus-flag'], { encoding: 'utf8' });
  if (usageError.status !== 2) throw new Error('scan-secrets.mjs did not exit 2 on an unknown flag');

  // scan-dependencies.mjs: no manifest present must report the deterministic no-manifest
  // path rather than attempting a network-dependent audit.
  const noManifestDir = join(temporaryRoot, 'no-manifest');
  await mkdir(noManifestDir);
  const noManifest = spawnSync(process.execPath, [join(skillRoot, 'scripts', 'scan-dependencies.mjs'), noManifestDir, '--json'], { encoding: 'utf8' });
  if (noManifest.error) throw new Error(`scan-dependencies.mjs failed to run: ${noManifest.error.message}`);
  const noManifestReport = JSON.parse(noManifest.stdout);
  if (noManifestReport.results?.[0]?.status !== 'no-known-manifest-found') throw new Error('scan-dependencies.mjs did not report no-known-manifest-found for an empty directory');
  if (noManifest.status !== 3) throw new Error('scan-dependencies.mjs did not exit 3 when nothing was scanned');

  // A manifest without a lockfile must also be skipped (no network call attempted).
  const noLockfileDir = join(temporaryRoot, 'no-lockfile');
  await mkdir(noLockfileDir);
  await writeFile(join(noLockfileDir, 'package.json'), '{"name":"fixture","version":"0.0.0"}\n');
  const noLockfile = spawnSync(process.execPath, [join(skillRoot, 'scripts', 'scan-dependencies.mjs'), noLockfileDir, '--json'], { encoding: 'utf8' });
  if (noLockfile.error) throw new Error(`scan-dependencies.mjs failed to run: ${noLockfile.error.message}`);
  const noLockfileReport = JSON.parse(noLockfile.stdout);
  if (noLockfileReport.results?.[0]?.status !== 'no-known-manifest-found') throw new Error('scan-dependencies.mjs scanned an ecosystem without a lockfile present');

  // fetch-platform-alerts.mjs: force the "gh not on PATH" branch deterministically by
  // running with an empty PATH, regardless of what's actually installed on this host.
  const noGh = spawnSync(process.execPath, [join(skillRoot, 'scripts', 'fetch-platform-alerts.mjs'), '--json'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '' },
  });
  if (noGh.status !== 2) throw new Error('fetch-platform-alerts.mjs did not exit 2 when gh is unavailable');
  const noGhReport = JSON.parse(noGh.stdout);
  if (noGhReport.available !== false) throw new Error('fetch-platform-alerts.mjs did not report unavailable when gh is missing');
} finally {
  const relativeTemporaryRoot = relative(resolve(tmpdir()), temporaryRoot);
  if (!relativeTemporaryRoot || relativeTemporaryRoot.startsWith('..')) throw new Error('Refusing to clean an unexpected temporary path');
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log('Security engineering workflow tests passed.');
