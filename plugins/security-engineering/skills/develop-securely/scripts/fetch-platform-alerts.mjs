#!/usr/bin/env node

import process from 'node:process';
import { spawnSync } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const jsonOutput = rawArgs.includes('--json');
const repoFlagIndex = rawArgs.indexOf('--repo');
const explicitRepo = repoFlagIndex === -1 ? null : rawArgs[repoFlagIndex + 1];
const knownFlags = new Set(['--json', '--repo']);
const unexpected = rawArgs.filter((arg, index) => arg.startsWith('--') ? !knownFlags.has(arg) : rawArgs[index - 1] !== '--repo');

if (unexpected.length > 0 || (repoFlagIndex !== -1 && !explicitRepo)) {
  console.error('Usage: fetch-platform-alerts.mjs [--repo owner/name] [--json]');
  process.exit(2);
}

function gh(args) {
  return spawnSync('gh', args, { encoding: 'utf8' });
}

const versionProbe = gh(['--version']);
if (versionProbe.error) {
  const message = 'gh (GitHub CLI) was not found on PATH. Install it (https://cli.github.com) and run `gh auth login`, then re-run this script. Falling back to code review only for platform-native alerts.';
  if (jsonOutput) console.log(JSON.stringify({ available: false, reason: message }, null, 2));
  else console.error(message);
  process.exit(2);
}

let repo = explicitRepo;
if (!repo) {
  const inferred = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
  if (inferred.error || inferred.status !== 0) {
    const message = 'Could not infer the current repository from `gh repo view` (not a GitHub-backed git repo, or gh is not authenticated). Pass --repo owner/name explicitly.';
    if (jsonOutput) console.log(JSON.stringify({ available: false, reason: message }, null, 2));
    else console.error(message);
    process.exit(2);
  }
  repo = inferred.stdout.trim();
}

const SOURCES = [
  { key: 'codeScanning', path: `repos/${repo}/code-scanning/alerts?state=open&per_page=100` },
  { key: 'dependabot', path: `repos/${repo}/dependabot/alerts?state=open&per_page=100` },
  { key: 'secretScanning', path: `repos/${repo}/secret-scanning/alerts?state=open&per_page=100` },
];

const report = { repo, sources: {} };

for (const source of SOURCES) {
  const result = gh(['api', source.path]);
  if (result.error || result.status !== 0) {
    report.sources[source.key] = {
      status: 'unavailable',
      reason: (result.stderr || 'request failed').trim().split('\n')[0],
    };
    continue;
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    report.sources[source.key] = { status: 'unparseable-response' };
    continue;
  }
  if (!Array.isArray(parsed)) {
    report.sources[source.key] = { status: 'unavailable', reason: parsed?.message ?? 'unexpected response shape' };
    continue;
  }
  if (source.key === 'secretScanning') {
    // Never surface the alert payload verbatim: summarize by secret type only, no locations or values.
    const byType = {};
    for (const alert of parsed) byType[alert.secret_type ?? 'unknown'] = (byType[alert.secret_type ?? 'unknown'] ?? 0) + 1;
    report.sources[source.key] = { status: 'ok', openCount: parsed.length, byType };
    continue;
  }
  if (source.key === 'dependabot') {
    const bySeverity = {};
    for (const alert of parsed) {
      const severity = alert.security_advisory?.severity ?? 'unknown';
      bySeverity[severity] = (bySeverity[severity] ?? 0) + 1;
    }
    report.sources[source.key] = {
      status: 'ok',
      openCount: parsed.length,
      bySeverity,
      packages: [...new Set(parsed.map((alert) => alert.dependency?.package?.name).filter(Boolean))].slice(0, 50),
    };
    continue;
  }
  const bySeverity = {};
  for (const alert of parsed) {
    const severity = alert.rule?.security_severity_level ?? alert.rule?.severity ?? 'unknown';
    bySeverity[severity] = (bySeverity[severity] ?? 0) + 1;
  }
  report.sources[source.key] = {
    status: 'ok',
    openCount: parsed.length,
    bySeverity,
    rules: [...new Set(parsed.map((alert) => alert.rule?.id).filter(Boolean))].slice(0, 50),
  };
}

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Platform security alerts for ${repo}`);
  for (const [key, value] of Object.entries(report.sources)) {
    if (value.status === 'ok') {
      console.log(`- ${key}: ${value.openCount} open (${JSON.stringify(value.bySeverity ?? value.byType)})`);
    } else {
      console.log(`- ${key}: ${value.status}${value.reason ? ` — ${value.reason}` : ''}`);
    }
  }
}

const anyOpen = Object.values(report.sources).some((source) => source.status === 'ok' && source.openCount > 0);
process.exit(anyOpen ? 1 : 0);
