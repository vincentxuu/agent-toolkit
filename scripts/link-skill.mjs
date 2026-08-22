#!/usr/bin/env node

import { cp, lstat, mkdir, readlink, symlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const skillName = args.shift();
const validSkillName = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

function option(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

function usage() {
  console.error('Usage: node scripts/link-skill.mjs <skill> [--host shared|codex|copilot|opencode|claude] [--scope user|project] [--project <path>] [--copy]');
}

if (!skillName || !validSkillName.test(skillName) || skillName.includes('--')) {
  usage();
  process.exit(2);
}

const host = option('--host', 'shared');
const scope = option('--scope', 'user');
const project = option('--project', process.cwd());
const copy = args.includes('--copy');
const sharedHosts = new Set(['shared', 'codex', 'copilot', 'opencode']);

if (!sharedHosts.has(host) && host !== 'claude') throw new Error(`Unsupported host: ${host}`);
if (!['user', 'project'].includes(scope)) throw new Error(`Unsupported scope: ${scope}`);

const source = join(repoRoot, 'plugins', skillName, 'skills', skillName);
await lstat(source).catch(() => {
  throw new Error(`Unknown skill: ${skillName}`);
});

const base = scope === 'user' ? homedir() : resolve(project);
const discoveryRoot = host === 'claude'
  ? join(base, '.claude', 'skills')
  : join(base, '.agents', 'skills');
const destination = join(discoveryRoot, skillName);

const existing = await lstat(destination).catch(() => null);
if (existing) {
  if (existing.isSymbolicLink()) {
    const current = resolve(dirname(destination), await readlink(destination));
    if (current === source && !copy) {
      console.log(`Already linked: ${destination}`);
      process.exit(0);
    }
  }
  throw new Error(`Destination already exists; refusing to overwrite: ${destination}`);
}

await mkdir(discoveryRoot, { recursive: true });
if (copy) {
  await cp(source, destination, { recursive: true, force: false, errorOnExist: true });
  console.log(`Copied ${relative(repoRoot, source)} -> ${destination}`);
} else {
  await symlink(source, destination, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`Linked ${destination} -> ${source}`);
}
