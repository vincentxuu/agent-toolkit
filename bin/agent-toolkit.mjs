#!/usr/bin/env node

import { cp, lstat, mkdir, readFile, readdir, readlink, symlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [command = 'help', ...args] = process.argv.slice(2);
const skillPattern = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

function parse(allowedValues = [], allowedFlags = []) {
  const values = {};
  const flags = new Set();
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (allowedFlags.includes(token)) {
      flags.add(token);
      continue;
    }
    if (allowedValues.includes(token)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${token} requires a value`);
      values[token] = value;
      index += 1;
      continue;
    }
    if (token.startsWith('--')) throw new Error(`Unknown option: ${token}`);
    positional.push(token);
  }
  return { values, flags, positional };
}

function run(script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [join(root, 'scripts', script), ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function exists(path) {
  return lstat(path).then(() => true, () => false);
}

async function sameDirectory(left, right) {
  const walk = async (base, current = base) => {
    const result = [];
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const child = join(current, entry.name);
      if (entry.isDirectory()) result.push(...await walk(base, child));
      else if (entry.isFile()) result.push(relative(base, child));
      else return null;
    }
    return result;
  };
  const leftFiles = await walk(left);
  const rightFiles = await walk(right);
  if (!leftFiles || !rightFiles || leftFiles.sort().join('\n') !== rightFiles.sort().join('\n')) return false;
  for (const path of leftFiles) {
    if (!(await readFile(join(left, path))).equals(await readFile(join(right, path)))) return false;
  }
  return true;
}

async function locateSkill(skillName) {
  if (!skillPattern.test(skillName) || skillName.includes('--')) throw new Error(`Invalid skill name: ${skillName}`);
  const matches = [];
  for (const plugin of await readdir(join(root, 'plugins'), { withFileTypes: true })) {
    if (!plugin.isDirectory()) continue;
    const candidate = join(root, 'plugins', plugin.name, 'skills', skillName);
    if (await exists(join(candidate, 'SKILL.md'))) matches.push(candidate);
  }
  if (matches.length === 0) throw new Error(`Unknown skill: ${skillName}`);
  if (matches.length > 1) throw new Error(`Skill name is ambiguous across plugins: ${skillName}`);
  return matches[0];
}

async function add() {
  const parsed = parse(['--agent', '--project'], ['--global', '--link', '--all', '--claude']);
  if (parsed.positional.length > 1) throw new Error('add accepts exactly one skill name');
  const skillName = parsed.positional[0];
  if (!skillName) throw new Error('Usage: agent-toolkit add <skill> [--agent all|shared|claude] [--global] [--link]');
  const source = await locateSkill(skillName);
  const selectors = [parsed.flags.has('--all'), parsed.flags.has('--claude'), Boolean(parsed.values['--agent'])].filter(Boolean).length;
  if (selectors > 1) throw new Error('Use only one of --all, --claude, or --agent');
  const agent = parsed.flags.has('--all') ? 'all' : parsed.flags.has('--claude') ? 'claude' : (parsed.values['--agent'] ?? 'shared');
  if (!['all', 'shared', 'claude'].includes(agent)) throw new Error(`Unsupported agent target: ${agent}`);
  if (parsed.flags.has('--global') && parsed.values['--project']) throw new Error('--global and --project cannot be combined');
  const base = parsed.flags.has('--global') ? homedir() : resolve(parsed.values['--project'] ?? process.cwd());
  const destinations = [];
  if (agent === 'all' || agent === 'shared') destinations.push(join(base, '.agents', 'skills', skillName));
  if (agent === 'all' || agent === 'claude') destinations.push(join(base, '.claude', 'skills', skillName));
  const link = parsed.flags.has('--link');
  const pending = [];

  for (const destination of destinations) {
    const existing = await lstat(destination).catch(() => null);
    if (!existing) {
      pending.push(destination);
      continue;
    }
    if (link && existing.isSymbolicLink()) {
      const target = resolve(dirname(destination), await readlink(destination));
      if (target === source) {
        console.log(`Already linked: ${destination}`);
        continue;
      }
    }
    if (!link && existing.isDirectory() && await sameDirectory(source, destination)) {
      console.log(`Already installed: ${destination}`);
      continue;
    }
    throw new Error(`Destination differs; refusing to overwrite: ${destination}`);
  }

  for (const destination of pending) {
    await mkdir(dirname(destination), { recursive: true });
    if (link) {
      await symlink(source, destination, process.platform === 'win32' ? 'junction' : 'dir');
      console.log(`Linked ${destination}`);
    } else {
      await cp(source, destination, { recursive: true, force: false, errorOnExist: true });
      console.log(`Installed ${destination}`);
    }
  }

  if (link && !parsed.flags.has('--global')) console.log('Note: project-local absolute links are intended for local development and should not be committed.');
  console.log('Start a new agent session to load the skill.');
}

async function list() {
  for (const plugin of (await readdir(join(root, 'plugins'), { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
    const skillsRoot = join(root, 'plugins', plugin.name, 'skills');
    const skills = await exists(skillsRoot)
      ? (await readdir(skillsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
      : [];
    console.log(`${plugin.name}: ${skills.join(', ') || '(no skills)'}`);
  }
}

async function pack() {
  const parsed = parse(['--host']);
  if (parsed.positional.length > 1) throw new Error('pack accepts exactly one plugin name');
  const pluginName = parsed.positional[0];
  if (!pluginName) throw new Error('Usage: agent-toolkit pack <plugin> [--host all|standard|web|codex|claude]');
  const host = parsed.values['--host'] ?? 'all';
  const hosts = host === 'all' ? ['standard', 'web', 'codex', 'claude'] : [host];
  for (const target of hosts) run('package-host.mjs', [pluginName, target]);
  run('checksums.mjs');
}

function help() {
  console.log(`Agent Toolkit

Usage:
  agent-toolkit add <skill>              Install into the current project for Agent Skills clients
  agent-toolkit add <skill> --claude     Install into the current project for Claude Code
  agent-toolkit add <skill> --all        Install both shared and Claude Code copies
  agent-toolkit add <skill> --global     Install for the current user
  agent-toolkit add <skill> --link       Link instead of copy for local development
  agent-toolkit list                     List available plugins and skills
  agent-toolkit doctor                   Run the full validation suite
  agent-toolkit pack <plugin>            Build all supported plugin packages
  agent-toolkit help                     Show this help`);
}

try {
  if (command === 'add') await add();
  else if (command === 'list') await list();
  else if (command === 'doctor') run('verify.mjs');
  else if (command === 'pack') await pack();
  else if (command === 'help' || command === '--help' || command === '-h') help();
  else throw new Error(`Unknown command: ${command}`);
} catch (error) {
  console.error(`agent-toolkit: ${error.message}`);
  process.exit(1);
}
