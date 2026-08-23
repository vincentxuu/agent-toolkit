#!/usr/bin/env node

import { lstat, readdir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const jsonOutput = rawArgs.includes('--json');
const positional = rawArgs.filter((arg) => !arg.startsWith('--'));
const unknownFlag = rawArgs.find((arg) => arg.startsWith('--') && arg !== '--json');

if (unknownFlag) {
  console.error(`Unknown flag: ${unknownFlag}`);
  console.error('Usage: scan-secrets.mjs [path ...] [--json]');
  process.exit(2);
}

const targets = (positional.length > 0 ? positional : ['.']).map((path) => resolve(path));

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'vendor', '.venv', '__pycache__']);
const SKIP_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.mp4', '.webm', '.mov', '.pdf', '.zip', '.tar', '.gz', '.lock']);

// Each pattern is built from parts rather than one literal template so this
// file's own source never contains a contiguous string that looks like a
// real credential to a naive scanner (including the repo's own validate.mjs).
const RULES = [
  { name: 'aws-access-key-id', re: new RegExp('AKIA' + '[0-9A-Z]{16}') },
  { name: 'github-token', re: new RegExp('gh[pousr]_' + '[A-Za-z0-9]{36,}') },
  { name: 'slack-token', re: new RegExp('xox' + '[baprs]-[0-9A-Za-z-]{10,}') },
  { name: 'stripe-live-key', re: new RegExp('sk_live_' + '[0-9a-zA-Z]{24,}') },
  { name: 'google-api-key', re: new RegExp('AIza' + '[0-9A-Za-z_-]{35}') },
  { name: 'private-key-block', re: new RegExp('-----BEGIN ' + '(RSA |EC |OPENSSH |DSA )?' + 'PRIVATE' + ' KEY-----') },
  {
    name: 'generic-credential-assignment',
    re: new RegExp('(api' + '[_-]?key|access' + '[_-]?token|secret|password)' + String.raw`\s*[:=]\s*['"][A-Za-z0-9._+/=-]{16,}['"]`, 'i'),
  },
];

function mask(value) {
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}

async function isTextFile(path) {
  try {
    const handle = await readFile(path);
    return !handle.subarray(0, 8000).includes(0);
  } catch {
    return false;
  }
}

async function collectFiles(path) {
  const results = [];
  let stat;
  try {
    stat = await lstat(path);
  } catch {
    return results;
  }
  if (stat.isSymbolicLink()) return results;
  if (stat.isFile()) {
    if (!SKIP_EXTENSIONS.has(extname(path).toLowerCase())) results.push(path);
    return results;
  }
  if (!stat.isDirectory()) return results;
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    results.push(...await collectFiles(join(path, entry.name)));
  }
  return results;
}

function runGitleaks(paths) {
  const probe = spawnSync('gitleaks', ['version'], { encoding: 'utf8' });
  if (probe.error) return null;
  const findings = [];
  for (const path of paths) {
    const result = spawnSync('gitleaks', ['detect', '--no-git', '--source', path, '--report-format', 'json', '--report-path', '-', '--exit-code', '0'], { encoding: 'utf8' });
    if (result.error) return null;
    const stdout = result.stdout?.trim();
    if (!stdout) continue;
    try {
      const parsed = JSON.parse(stdout);
      for (const item of parsed) {
        findings.push({
          file: item.File,
          line: item.StartLine ?? null,
          rule: item.RuleID ?? 'gitleaks-rule',
          match: mask(item.Secret ?? item.Match ?? ''),
        });
      }
    } catch {
      // gitleaks emitted non-JSON (e.g. an error string); skip this path rather than crash.
    }
  }
  return findings;
}

async function runBuiltinFallback(paths) {
  const findings = [];
  for (const root of paths) {
    for (const file of await collectFiles(root)) {
      if (!(await isTextFile(file))) continue;
      let content;
      try {
        content = await readFile(file, 'utf8');
      } catch {
        continue;
      }
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        for (const rule of RULES) {
          const match = lines[i].match(rule.re);
          if (match) findings.push({ file, line: i + 1, rule: rule.name, match: mask(match[0]) });
        }
      }
    }
  }
  return findings;
}

let tool = 'gitleaks';
let findings = runGitleaks(targets);
if (findings === null) {
  tool = 'builtin-fallback';
  findings = await runBuiltinFallback(targets);
}

const report = {
  tool,
  targets,
  findingCount: findings.length,
  findings,
  note: tool === 'builtin-fallback'
    ? 'gitleaks was not found on PATH; used a smaller built-in pattern set. Install gitleaks (https://github.com/gitleaks/gitleaks) for materially better coverage before treating this as a clean pass.'
    : null,
};

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Secret scan (${tool}) over: ${targets.join(', ')}`);
  if (report.note) console.log(`NOTE: ${report.note}`);
  if (findings.length === 0) {
    console.log('No findings.');
  } else {
    for (const finding of findings) {
      console.log(`FOUND ${finding.rule} ${finding.file}:${finding.line ?? '?'} (${finding.match})`);
    }
  }
}

process.exit(findings.length > 0 ? 1 : 0);
