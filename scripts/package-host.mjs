#!/usr/bin/env node

import { cp, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [pluginName, host = 'standard'] = process.argv.slice(2);
const supportedHosts = new Set(['standard', 'web', 'codex', 'claude']);
const validPluginName = /^[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/;

if (!pluginName || !validPluginName.test(pluginName) || pluginName.includes('--') || pluginName.includes('..') || !supportedHosts.has(host)) {
  console.error('Usage: node scripts/package-host.mjs <plugin> [standard|web|codex|claude]');
  process.exit(2);
}

const source = join(root, 'plugins', pluginName);
await lstat(source).catch(() => {
  throw new Error(`Unknown plugin: ${pluginName}`);
});

const distRoot = join(root, 'dist');
const destination = join(distRoot, host, pluginName);
const relativeDestination = relative(distRoot, destination);
if (!relativeDestination || relativeDestination.startsWith('..') || isAbsolute(relativeDestination)) {
  throw new Error('Refusing to package outside dist/');
}

await rm(destination, { recursive: true, force: true });
await mkdir(dirname(destination), { recursive: true });
if (host === 'web') {
  await mkdir(destination, { recursive: true });
  await cp(join(source, 'skills'), join(destination, 'skills'), { recursive: true });
  for (const skill of await readdir(join(destination, 'skills'), { withFileTypes: true })) {
    if (skill.isDirectory()) await cp(join(root, 'LICENSE'), join(destination, 'skills', skill.name, 'LICENSE'));
  }
} else {
  await cp(source, destination, { recursive: true });
}
await cp(join(root, 'LICENSE'), join(destination, 'LICENSE'));

if (host === 'codex' || host === 'claude') {
  const adapter = join(root, 'adapters', host, pluginName);
  await lstat(adapter).catch(() => {
    throw new Error(`Missing ${host} adapter for plugin: ${pluginName}`);
  });
  await cp(adapter, destination, { recursive: true });
}

console.log(`Packaged ${pluginName} for ${host}: ${destination}`);
