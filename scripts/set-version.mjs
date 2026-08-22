#!/usr/bin/env node

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const version = args[0];
const rootOption = args.indexOf('--root');
const root = rootOption === -1 ? defaultRoot : resolve(args[rootOption + 1] ?? '');
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!version || !semver.test(version)) {
  console.error('Usage: node scripts/set-version.mjs <semver> [--root <repository>]');
  process.exit(2);
}

async function filesUnder(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(child));
    else if (entry.isFile()) result.push(child);
  }
  return result;
}

const manifests = [join(root, 'package.json')];
for (const path of await filesUnder(join(root, 'plugins'))) {
  if (path.endsWith(`${join('', 'plugin.json')}`) && dirname(path) !== join(root, 'plugins')) manifests.push(path);
}
for (const path of manifests) {
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  manifest.version = version;
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

const claudeMarketplacePath = join(root, '.claude-plugin', 'marketplace.json');
const claudeMarketplace = JSON.parse(await readFile(claudeMarketplacePath, 'utf8'));
for (const plugin of claudeMarketplace.plugins ?? []) plugin.version = version;
await writeFile(claudeMarketplacePath, `${JSON.stringify(claudeMarketplace, null, 2)}\n`);

console.log(`Updated ${manifests.length} manifests and the Claude marketplace to ${version}.`);
