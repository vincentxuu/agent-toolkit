#!/usr/bin/env node

import { lstat, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'plugins', 'deep-research', 'skills', 'deep-research', 'SKILL.md');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'agent-toolkit-test-'));

function run(args) {
  const result = spawnSync(process.execPath, [join(root, 'scripts', 'link-skill.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Installer exited with status ${result.status}`);
}

try {
  const linkedProject = join(temporaryRoot, 'linked');
  const copiedProject = join(temporaryRoot, 'copied');
  run(['deep-research', '--host', 'shared', '--scope', 'project', '--project', linkedProject]);
  run(['deep-research', '--host', 'claude', '--scope', 'project', '--project', copiedProject, '--copy']);

  const linked = join(linkedProject, '.agents', 'skills', 'deep-research');
  const copied = join(copiedProject, '.claude', 'skills', 'deep-research');
  if (!(await lstat(linked)).isSymbolicLink()) throw new Error('Shared install is not a symlink');
  if ((await lstat(copied)).isSymbolicLink()) throw new Error('Claude copy install unexpectedly created a symlink');
  if ((await realpath(join(linked, 'SKILL.md'))) !== (await realpath(source))) throw new Error('Shared install points at the wrong skill');
  if ((await readFile(join(copied, 'SKILL.md'), 'utf8')) !== (await readFile(source, 'utf8'))) throw new Error('Copied skill differs from source');
  console.log('Installer smoke tests passed.');
} finally {
  const relativeTemporaryRoot = relative(resolve(tmpdir()), temporaryRoot);
  if (!relativeTemporaryRoot || relativeTemporaryRoot.startsWith('..') || relativeTemporaryRoot.includes(sep + '..' + sep)) {
    throw new Error('Refusing to clean an unexpected temporary path');
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}
