#!/usr/bin/env node

import { access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const jsonOutput = rawArgs.includes('--json');
const positional = rawArgs.filter((arg) => !arg.startsWith('--'));
const unknownFlag = rawArgs.find((arg) => arg.startsWith('--') && arg !== '--json');

if (unknownFlag || positional.length > 1) {
  console.error('Usage: scan-dependencies.mjs [path] [--json]');
  process.exit(2);
}

const root = resolve(positional[0] ?? '.');

async function exists(path) {
  return access(path).then(() => true, () => false);
}

function toolAvailable(bin, versionArgs = ['--version']) {
  const result = spawnSync(bin, versionArgs, { encoding: 'utf8' });
  return !result.error;
}

const ECOSYSTEMS = [
  {
    id: 'npm',
    manifest: 'package.json',
    lockfiles: ['package-lock.json'],
    tool: 'npm',
    detectArgs: ['--version'],
    run: (dir) => spawnSync('npm', ['audit', '--json'], { cwd: dir, encoding: 'utf8' }),
    summarize: (stdout) => {
      const parsed = JSON.parse(stdout);
      const byLevel = parsed?.metadata?.vulnerabilities ?? null;
      return byLevel ? { bySeverity: byLevel, totalDependencies: parsed?.metadata?.totalDependencies ?? null } : { raw: 'unrecognized npm audit schema' };
    },
    installHint: 'npm audit ships with npm; ensure npm is on PATH',
  },
  {
    id: 'pnpm',
    manifest: 'package.json',
    lockfiles: ['pnpm-lock.yaml'],
    tool: 'pnpm',
    detectArgs: ['--version'],
    run: (dir) => spawnSync('pnpm', ['audit', '--json'], { cwd: dir, encoding: 'utf8' }),
    summarize: (stdout) => ({ raw: JSON.parse(stdout) }),
    installHint: 'npm install -g pnpm',
  },
  {
    id: 'yarn',
    manifest: 'package.json',
    lockfiles: ['yarn.lock'],
    tool: 'yarn',
    detectArgs: ['--version'],
    run: (dir) => spawnSync('yarn', ['audit', '--json'], { cwd: dir, encoding: 'utf8' }),
    summarize: (stdout) => ({ raw: stdout.split('\n').filter(Boolean).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean) }),
    installHint: 'npm install -g yarn',
  },
  {
    id: 'python-pip',
    manifest: 'requirements.txt',
    lockfiles: ['requirements.txt'],
    tool: 'pip-audit',
    detectArgs: ['--version'],
    run: (dir) => spawnSync('pip-audit', ['-r', join(dir, 'requirements.txt'), '-f', 'json'], { encoding: 'utf8' }),
    summarize: (stdout) => ({ raw: JSON.parse(stdout) }),
    installHint: 'pipx install pip-audit',
  },
  {
    id: 'go',
    manifest: 'go.mod',
    lockfiles: ['go.sum'],
    tool: 'govulncheck',
    detectArgs: ['-version'],
    run: (dir) => spawnSync('govulncheck', ['-json', './...'], { cwd: dir, encoding: 'utf8' }),
    summarize: (stdout) => ({ raw: stdout.split('\n').filter(Boolean).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean) }),
    installHint: 'go install golang.org/x/vuln/cmd/govulncheck@latest',
  },
  {
    id: 'rust',
    manifest: 'Cargo.toml',
    lockfiles: ['Cargo.lock'],
    tool: 'cargo-audit',
    detectArgs: ['audit', '--version'],
    run: (dir) => spawnSync('cargo', ['audit', '--json'], { cwd: dir, encoding: 'utf8' }),
    summarize: (stdout) => ({ raw: JSON.parse(stdout) }),
    installHint: 'cargo install cargo-audit',
  },
];

const results = [];

for (const ecosystem of ECOSYSTEMS) {
  const manifestPath = join(root, ecosystem.manifest);
  if (!(await exists(manifestPath))) continue;
  const hasLockfile = (await Promise.all(ecosystem.lockfiles.map((name) => exists(join(root, name))))).some(Boolean);
  if (!hasLockfile) continue;

  const available = toolAvailable(ecosystem.tool, ecosystem.detectArgs);
  if (!available) {
    results.push({ ecosystem: ecosystem.id, manifest: ecosystem.manifest, status: 'no-scanner-available', hint: `install: ${ecosystem.installHint}` });
    continue;
  }

  const run = ecosystem.run(root);
  if (run.error) {
    results.push({ ecosystem: ecosystem.id, manifest: ecosystem.manifest, status: 'scan-failed', error: run.error.message });
    continue;
  }
  try {
    const summary = ecosystem.summarize(run.stdout ?? '');
    results.push({ ecosystem: ecosystem.id, manifest: ecosystem.manifest, status: 'scanned', exitCode: run.status, summary });
  } catch (error) {
    results.push({ ecosystem: ecosystem.id, manifest: ecosystem.manifest, status: 'scan-output-unparseable', exitCode: run.status, error: error.message, rawStdoutPreview: (run.stdout ?? '').slice(0, 500) });
  }
}

if (results.length === 0) {
  results.push({ ecosystem: null, status: 'no-known-manifest-found', hint: 'no package.json+lockfile, requirements.txt, go.mod, or Cargo.toml detected under this path' });
}

if (jsonOutput) {
  console.log(JSON.stringify({ root, results }, null, 2));
} else {
  console.log(`Dependency scan over: ${root}`);
  for (const entry of results) {
    console.log(`- ${entry.ecosystem ?? 'none'}: ${entry.status}${entry.hint ? ` (${entry.hint})` : ''}`);
    if (entry.status === 'scanned') console.log(`  exitCode=${entry.exitCode} summary=${JSON.stringify(entry.summary)}`);
  }
  console.log('Note: only the npm summary is normalized. pnpm/yarn/pip-audit/govulncheck/cargo-audit results are passed through raw for the caller to interpret against that tool\'s own schema.');
}

const anyVulnerable = results.some((entry) => entry.status === 'scanned' && entry.exitCode !== 0);
const anyUnscanned = results.some((entry) => entry.status !== 'scanned');
process.exit(anyVulnerable ? 1 : anyUnscanned ? 3 : 0);
