#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const skillRoot = join(root, 'plugins', 'content-authoring', 'skills', 'manage-post');
const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
const create = await readFile(join(skillRoot, 'references', 'create-workflow.md'), 'utf8');
const update = await readFile(join(skillRoot, 'references', 'update-workflow.md'), 'utf8');
const verify = await readFile(join(skillRoot, 'references', 'verify-workflow.md'), 'utf8');
const quidproquoCreate = await readFile(join(skillRoot, 'references', 'quidproquo-create.md'), 'utf8');
const frontmatter = await readFile(join(skillRoot, 'references', 'quidproquo-frontmatter.md'), 'utf8');

for (const phrase of [
  'name: manage-post',
  '**Create:**',
  '**Update:**',
  '**Verify:**',
  'Never stage with `git add .`',
  'Without a filesystem',
]) {
  if (!skill.includes(phrase)) throw new Error(`manage-post is missing core policy: ${phrase}`);
}

if (skill.includes('Root: `src/content/posts/<category>/`')) {
  throw new Error('The portable core embeds the Quidproquo output root');
}

for (const phrase of ['Metadata gate', 'build a fact inventory', 'Do not infer a queue, worker, scheduler', 'For Web/no-filesystem use', 'Run documented article checks']) {
  if (!create.includes(phrase)) throw new Error(`Create workflow is missing behavior: ${phrase}`);
}

for (const phrase of [
  'Preserve the original filename, slug, publication `date`',
  '`updated` field',
  'Re-verify changed prices, versions, dates',
  'When a zh/en pair exists',
  'Run `pnpm verify`',
]) {
  if (!update.includes(phrase)) throw new Error(`Update workflow is missing behavior: ${phrase}`);
}

for (const phrase of [
  'Verification is read-only',
  'claim inventory',
  '`Confirmed`, `Outdated`, `Contradicted`, `Unverifiable`, or `Misframed`',
  'Run `pnpm verify`',
  'Report separately',
]) {
  if (!verify.includes(phrase)) throw new Error(`Verify workflow is missing behavior: ${phrase}`);
}

for (const phrase of [
  '`src/content/posts/<category>/YYYY-MM-DD-<slug>.md`',
  'Run `pnpm verify`',
  '`general` is not a valid frontmatter `type`',
  'Do not add `definition_en` to per-post frontmatter',
  'Never use `git add .`',
  'Language is an editorial/user decision',
  'Coverage warnings are blocking',
  'register-scan.sh',
]) {
  if (!quidproquoCreate.includes(phrase)) throw new Error(`Quidproquo create workflow is missing behavior: ${phrase}`);
}

if (!frontmatter.includes("| `lang` | `'zh-TW'` \\| `'en'` | ✅")) {
  throw new Error('Quidproquo frontmatter reference does not mark lang as validator-required');
}
if (frontmatter.includes('| `readingTime` |')) throw new Error('Quidproquo authoring reference should not invite manual readingTime');

for (const relativePath of [
  ['references', 'create-workflow.md'],
  ['references', 'update-workflow.md'],
  ['references', 'verify-workflow.md'],
  ['references', 'writing-principles.md'],
  ['references', 'evidence-policy.md'],
  ['references', 'quidproquo-create.md'],
  ['references', 'quidproquo-frontmatter.md'],
  ['references', 'quidproquo-writing.md'],
  ['assets', 'templates', 'debug.md'],
  ['assets', 'templates', 'deep-dive.md'],
  ['assets', 'templates', 'general.md'],
  ['assets', 'quidproquo', 'tech-post.md'],
  ['assets', 'quidproquo', 'tech-deep-dive.md'],
  ['assets', 'quidproquo', 'general-post.md'],
]) {
  await access(join(skillRoot, ...relativePath));
}

console.log('Content authoring lifecycle tests passed.');
