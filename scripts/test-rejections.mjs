#!/usr/bin/env node

import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'agent-toolkit-negative-'));

function invoke(script, args = []) {
  return spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

function expectFailure(result, label, pattern) {
  if (result.status === 0) throw new Error(`${label}: unexpectedly succeeded`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (pattern && !pattern.test(output)) throw new Error(`${label}: unexpected error output: ${output}`);
}

try {
  expectFailure(invoke('package-host.mjs', ['../deep-research', 'standard']), 'plugin traversal', /Usage/);
  expectFailure(invoke('package-host.mjs', ['deep-research', 'gemini']), 'retired Gemini host', /Usage/);
  expectFailure(invoke('link-skill.mjs', ['../../deep-research', '--scope', 'project', '--project', temporaryRoot]), 'skill traversal', /Usage/);
  expectFailure(invoke('link-skill.mjs', ['deep-research', '--host', 'unknown', '--scope', 'project', '--project', temporaryRoot]), 'unknown host', /Unsupported host/);

  const existingProject = join(temporaryRoot, 'existing');
  const existingTarget = join(existingProject, '.agents', 'skills', 'deep-research');
  await mkdir(existingTarget, { recursive: true });
  expectFailure(invoke('link-skill.mjs', ['deep-research', '--scope', 'project', '--project', existingProject]), 'existing destination', /refusing to overwrite/i);

  const fixture = join(temporaryRoot, 'fixture');
  await mkdir(fixture, { recursive: true });
  for (const name of ['plugins', '.agents', '.claude-plugin']) await cp(join(root, name), join(fixture, name), { recursive: true });
  for (const name of ['package.json', 'LICENSE']) await cp(join(root, name), join(fixture, name));

  const versionResult = invoke('set-version.mjs', ['1.2.3', '--root', fixture]);
  if (versionResult.status !== 0) throw new Error(`version update failed: ${versionResult.stderr}`);
  const validFixture = invoke('validate.mjs', ['--root', fixture]);
  if (validFixture.status !== 0) throw new Error(`updated fixture did not validate: ${validFixture.stderr}`);
  if (JSON.parse(await readFile(join(fixture, 'plugins', 'deep-research', 'plugin.json'), 'utf8')).version !== '1.2.3') {
    throw new Error('portable manifest version was not updated');
  }

  const adapterPath = join(fixture, 'plugins', 'deep-research', '.claude-plugin', 'plugin.json');
  const adapter = JSON.parse(await readFile(adapterPath, 'utf8'));
  adapter.version = '9.9.9';
  await writeFile(adapterPath, `${JSON.stringify(adapter, null, 2)}\n`);
  expectFailure(invoke('validate.mjs', ['--root', fixture]), 'adapter version drift', /version must match/);

  console.log('Negative-path tests passed.');
} finally {
  const relativeTemporaryRoot = relative(resolve(tmpdir()), temporaryRoot);
  if (!relativeTemporaryRoot || relativeTemporaryRoot.startsWith('..')) throw new Error('Refusing to clean an unexpected temporary path');
  await rm(temporaryRoot, { recursive: true, force: true });
}
