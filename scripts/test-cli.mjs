#!/usr/bin/env node

import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'agent-toolkit-cli-'));
const cli = join(root, 'bin', 'agent-toolkit.mjs');

function invoke(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
}

function expectSuccess(result, label) {
  if (result.status !== 0) throw new Error(`${label}: ${result.stderr}`);
}

try {
  const project = join(temporaryRoot, 'project');
  await mkdir(project);
  expectSuccess(invoke(['add', 'deep-research'], project), 'default add');
  const shared = join(project, '.agents', 'skills', 'deep-research', 'SKILL.md');
  if (await lstat(join(project, '.claude')).then(() => true, () => false)) throw new Error('Default add unexpectedly installed Claude copy');
  expectSuccess(invoke(['add', 'deep-research'], project), 'idempotent add');

  const allProject = join(temporaryRoot, 'all');
  await mkdir(allProject);
  expectSuccess(invoke(['add', 'deep-research', '--all'], allProject), 'all-agent add');
  const allShared = join(allProject, '.agents', 'skills', 'deep-research', 'SKILL.md');
  const allClaude = join(allProject, '.claude', 'skills', 'deep-research', 'SKILL.md');
  if (!(await readFile(allShared)).equals(await readFile(allClaude))) throw new Error('All-agent installs differ');

  const linkedProject = join(temporaryRoot, 'linked');
  await mkdir(linkedProject);
  expectSuccess(invoke(['add', 'deep-research', '--agent', 'shared', '--link'], linkedProject), 'linked add');
  if (!(await lstat(join(linkedProject, '.agents', 'skills', 'deep-research'))).isSymbolicLink()) throw new Error('Link mode did not create a link');

  const conflictProject = join(temporaryRoot, 'conflict');
  const conflict = join(conflictProject, '.agents', 'skills', 'deep-research');
  await mkdir(conflict, { recursive: true });
  await writeFile(join(conflict, 'SKILL.md'), 'different\n');
  const conflictResult = invoke(['add', 'deep-research', '--agent', 'shared'], conflictProject);
  if (conflictResult.status === 0 || !/refusing to overwrite/i.test(conflictResult.stderr)) throw new Error('Conflict was not rejected');

  const listResult = invoke(['list'], project);
  expectSuccess(listResult, 'list');
  if (!/deep-research: deep-research/.test(listResult.stdout)) throw new Error('List omitted deep-research');
  if (!/content-authoring: manage-post/.test(listResult.stdout)) throw new Error('List omitted content-authoring');
  if (!/software-delivery: develop-with-spec/.test(listResult.stdout)) throw new Error('List omitted software-delivery');

  const writingProject = join(temporaryRoot, 'writing');
  await mkdir(writingProject);
  expectSuccess(invoke(['add', 'manage-post'], writingProject), 'manage-post add');
  await readFile(join(writingProject, '.agents', 'skills', 'manage-post', 'references', 'update-workflow.md'));
  const retiredWritingName = invoke(['add', 'write-post'], writingProject);
  if (retiredWritingName.status === 0 || !/Unknown skill: write-post/.test(retiredWritingName.stderr)) {
    throw new Error('Retired write-post name was not rejected');
  }

  const developmentProject = join(temporaryRoot, 'development');
  await mkdir(developmentProject);
  expectSuccess(invoke(['add', 'develop-with-spec'], developmentProject), 'develop-with-spec add');
  await readFile(join(developmentProject, '.agents', 'skills', 'develop-with-spec', 'scripts', 'verify-playwright-video.mjs'));

  const unknownOption = invoke(['add', 'deep-research', '--surprise'], project);
  if (unknownOption.status === 0 || !/Unknown option/.test(unknownOption.stderr)) throw new Error('Unknown option was not rejected');
  console.log('User-facing CLI tests passed.');
} finally {
  const relativeTemporaryRoot = relative(resolve(tmpdir()), temporaryRoot);
  if (!relativeTemporaryRoot || relativeTemporaryRoot.startsWith('..')) throw new Error('Refusing to clean an unexpected temporary path');
  await rm(temporaryRoot, { recursive: true, force: true });
}
