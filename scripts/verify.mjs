#!/usr/bin/env node

import { access, readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

function run(script, args = []) {
  const result = spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('validate.mjs');
const pluginNames = (await readdir(join(root, 'plugins'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const adapterManifest = {
  codex: join('.codex-plugin', 'plugin.json'),
  claude: join('.claude-plugin', 'plugin.json'),
};
const packagedHosts = new Map();

for (const pluginName of pluginNames) {
  const hosts = ['standard', 'web'];
  for (const host of Object.keys(adapterManifest)) {
    const adapterRoot = join(root, 'adapters', host, pluginName);
    if (await access(adapterRoot).then(() => true, () => false)) hosts.push(host);
  }
  packagedHosts.set(pluginName, hosts);
  for (const host of hosts) run('package-host.mjs', [pluginName, host]);
}
run('test-installers.mjs');
run('test-cli.mjs');
run('test-content-authoring.mjs');
run('test-rejections.mjs');

async function filesUnder(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(child));
    else if (entry.isFile()) result.push(child);
  }
  return result;
}

for (const [pluginName, hosts] of packagedHosts) {
  const sourceSkillsRoot = join(root, 'plugins', pluginName, 'skills');
  const sourceFiles = await filesUnder(sourceSkillsRoot);
  for (const host of hosts) {
    const packageRoot = join(root, 'dist', host, pluginName);
    await access(join(packageRoot, 'LICENSE'));
    if (host === 'codex' || host === 'claude') await access(join(packageRoot, adapterManifest[host]));
    for (const sourcePath of sourceFiles) {
      const relativePath = relative(sourceSkillsRoot, sourcePath);
      const packagedPath = join(packageRoot, 'skills', relativePath);
      if (!(await readFile(packagedPath)).equals(await readFile(sourcePath))) {
        throw new Error(`${host}/${pluginName}/${relativePath} differs from canonical source`);
      }
    }
  }
}

run('checksums.mjs');

console.log('Full verification passed.');
