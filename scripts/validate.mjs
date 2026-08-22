#!/usr/bin/env node

import { access, readFile, readdir, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootOption = process.argv.indexOf('--root');
const root = rootOption === -1 ? defaultRoot : resolve(process.argv[rootOption + 1] ?? '');
const pluginsRoot = join(root, 'plugins');
const errors = [];
const expectedSchema = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const manifestFields = new Set(['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions']);
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const pluginNamePattern = /^[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/;

async function json(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    errors.push(`${path}: invalid JSON (${error.message})`);
    return null;
  }
}

async function exists(path) {
  return access(path).then(() => true, () => false);
}

async function filesUnder(path) {
  const result = [];
  if (!(await exists(path))) return result;
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(child));
    else if (entry.isFile()) result.push(child);
  }
  return result;
}

const rootPackage = await json(join(root, 'package.json'));
if (rootPackage?.bin?.['agent-toolkit'] !== './bin/agent-toolkit.mjs') errors.push('package.json: missing agent-toolkit CLI bin');

const pluginDirs = (await readdir(pluginsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (pluginDirs.length === 0) errors.push('plugins/: no plugins found');

for (const pluginName of pluginDirs) {
  const pluginRoot = join(pluginsRoot, pluginName);
  const manifest = await json(join(pluginRoot, 'plugin.json'));
  if (manifest) {
    for (const field of Object.keys(manifest)) {
      if (!manifestFields.has(field)) errors.push(`${pluginName}: unknown portable manifest field ${field}`);
    }
    if (manifest.$schema !== expectedSchema) errors.push(`${pluginName}: unsupported or missing Agent Plugins schema`);
    if (manifest.name !== pluginName) errors.push(`${pluginName}: plugin.json name must match directory`);
    if (!pluginNamePattern.test(manifest.name) || manifest.name.includes('--') || manifest.name.includes('..')) errors.push(`${pluginName}: invalid plugin name`);
    if (!semver.test(manifest.version ?? '')) errors.push(`${pluginName}: version must be valid SemVer`);
    if (rootPackage && manifest.version !== rootPackage.version) errors.push(`${pluginName}: plugin version must match root package version`);
    if (manifest.license !== 'MIT') errors.push(`${pluginName}: plugin.json must declare the repository MIT license`);
    if (manifest.author && (typeof manifest.author !== 'object' || Array.isArray(manifest.author))) errors.push(`${pluginName}: author must be an object`);
    if (manifest.author) {
      for (const field of Object.keys(manifest.author)) {
        if (!['name', 'email', 'url'].includes(field)) errors.push(`${pluginName}: unsupported author field ${field}`);
      }
    }
    if (manifest.keywords && (!Array.isArray(manifest.keywords) || manifest.keywords.some((value) => typeof value !== 'string'))) errors.push(`${pluginName}: keywords must be strings`);
  }

  for (const adapterPath of [
    join(pluginRoot, '.codex-plugin', 'plugin.json'),
    join(pluginRoot, '.claude-plugin', 'plugin.json'),
  ]) {
    if (!(await exists(adapterPath))) continue;
    const adapter = await json(adapterPath);
    if (adapter && adapter.name !== pluginName) errors.push(`${adapterPath}: adapter name must match plugin`);
    if (adapter && adapter.version !== manifest?.version) errors.push(`${adapterPath}: adapter version must match portable manifest`);
  }

  const skillsRoot = join(pluginRoot, 'skills');
  if (!(await exists(skillsRoot))) continue;
  const skillDirs = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const skillName of skillDirs) {
    const skillRoot = join(skillsRoot, skillName);
    const skillPath = join(skillRoot, 'SKILL.md');
    if (!(await exists(skillPath))) {
      errors.push(`${skillName}: missing SKILL.md`);
      continue;
    }

    const resolvedSkill = await realpath(skillPath);
    const relativeSkill = relative(await realpath(pluginRoot), resolvedSkill);
    if (relativeSkill.startsWith('..') || isAbsolute(relativeSkill)) {
      errors.push(`${skillPath}: resolves outside plugin root`);
      continue;
    }

    const source = await readFile(skillPath, 'utf8');
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
      errors.push(`${skillPath}: missing YAML frontmatter`);
      continue;
    }
    const declaredName = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
    if (declaredName !== skillName) errors.push(`${skillPath}: name must match directory`);
    if (!description) errors.push(`${skillPath}: description is required`);

    for (const match of source.matchAll(/`(references\/[^`]+)`/g)) {
      if (!(await exists(join(skillRoot, match[1])))) errors.push(`${skillPath}: missing ${match[1]}`);
    }

  }
}

const codexMarketplace = await json(join(root, '.agents', 'plugins', 'marketplace.json'));
if (codexMarketplace) {
  if (codexMarketplace.name !== 'agent-toolkit') errors.push('Codex marketplace name must be agent-toolkit');
  const entries = Array.isArray(codexMarketplace.plugins) ? codexMarketplace.plugins : [];
  for (const pluginName of pluginDirs) {
    const entry = entries.find((candidate) => candidate.name === pluginName);
    if (!entry) {
      errors.push(`Codex marketplace: missing ${pluginName}`);
      continue;
    }
    if (entry.source?.source !== 'local' || entry.source?.path !== `./plugins/${pluginName}`) errors.push(`Codex marketplace: invalid source for ${pluginName}`);
    if (!['AVAILABLE', 'INSTALLED_BY_DEFAULT', 'NOT_AVAILABLE'].includes(entry.policy?.installation)) errors.push(`Codex marketplace: invalid installation policy for ${pluginName}`);
    if (!['ON_INSTALL', 'ON_USE'].includes(entry.policy?.authentication)) errors.push(`Codex marketplace: invalid authentication policy for ${pluginName}`);
    if (!entry.category) errors.push(`Codex marketplace: category is required for ${pluginName}`);
  }
}

const claudeMarketplace = await json(join(root, '.claude-plugin', 'marketplace.json'));
if (claudeMarketplace) {
  if (claudeMarketplace.name !== 'agent-toolkit') errors.push('Claude marketplace name must be agent-toolkit');
  const entries = Array.isArray(claudeMarketplace.plugins) ? claudeMarketplace.plugins : [];
  for (const pluginName of pluginDirs) {
    const entry = entries.find((candidate) => candidate.name === pluginName);
    if (!entry) {
      errors.push(`Claude marketplace: missing ${pluginName}`);
      continue;
    }
    if (entry.source !== `./plugins/${pluginName}`) errors.push(`Claude marketplace: invalid source for ${pluginName}`);
    if (entry.version !== rootPackage?.version) errors.push(`Claude marketplace: version must match package for ${pluginName}`);
  }
}


for (const scanRoot of [join(root, 'plugins'), join(root, '.agents'), join(root, '.claude-plugin')]) {
  for (const path of await filesUnder(scanRoot)) {
    const content = await readFile(path, 'utf8').catch(() => '');
    if (/\/Users\/(?!<)[A-Za-z0-9._-]+\//.test(content) || /\/home\/(?!<)[A-Za-z0-9._-]+\//.test(content) || /[A-Za-z]:\\Users\\(?!<)[^\\\s]+\\/.test(content)) {
      errors.push(`${path}: contains a personal absolute path`);
    }
    if (/Bearer\s+(?!<)[A-Za-z0-9._~-]{16,}/i.test(content) || /(?:api[_-]?key|access[_-]?token|secret)\s*[:=]\s*["']?(?!<)[A-Za-z0-9._~-]{16,}/i.test(content) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
      errors.push(`${path}: may contain a credential or private key`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Validated ${pluginDirs.length} plugin(s): ${pluginDirs.join(', ')}`);
