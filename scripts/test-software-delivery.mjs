#!/usr/bin/env node

import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const skillRoot = join(root, 'plugins', 'software-delivery', 'skills', 'develop-with-spec');
const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
const playwright = await readFile(join(skillRoot, 'references', 'playwright-evidence.md'), 'utf8');
const crossRepo = await readFile(join(skillRoot, 'references', 'cross-repo-delivery.md'), 'utf8');
const review = await readFile(join(skillRoot, 'references', 'review-and-release.md'), 'utf8');
const specTemplate = await readFile(join(skillRoot, 'assets', 'spec.md'), 'utf8');
const designTemplate = await readFile(join(skillRoot, 'assets', 'design.md'), 'utf8');
const planTemplate = await readFile(join(skillRoot, 'assets', 'plan.md'), 'utf8');
const verificationTemplate = await readFile(join(skillRoot, 'assets', 'verification.md'), 'utf8');
const verifier = join(skillRoot, 'scripts', 'verify-playwright-video.mjs');

for (const phrase of [
  'name: develop-with-spec',
  "Reuse the repository's native SDD system",
  'exactly one item in progress',
  "video: 'on'",
  'Do not declare browser verification complete',
  'mark Playwright video `N/A`',
  'audit the real implementation rather than visible UI',
  'environment teardown and residue checks',
  'references/cross-repo-delivery.md',
  'references/review-and-release.md',
]) {
  if (!skill.includes(phrase)) throw new Error(`develop-with-spec is missing core policy: ${phrase}`);
}

for (const phrase of [
  'Video is finalized when the browser context closes',
  'zero unexpected or flaky results',
  'if-no-files-found: error',
  'pageerror',
  'unique sentinel',
  'cleanup in a `finally` path',
  'zero residual rows, jobs, files, sessions, and spawned services',
]) {
  if (!playwright.includes(phrase)) throw new Error(`Playwright evidence reference is missing: ${phrase}`);
}

for (const phrase of [
  'Do not infer completion from UI text',
  'Never hand-edit generated artifacts',
  'Test the exact branch combination',
  'Individual green test suites do not prove that the combined system works',
  '`implemented`, `locally verified`, `review resolved`',
]) {
  if (!crossRepo.includes(phrase)) throw new Error(`Cross-repository delivery reference is missing: ${phrase}`);
}

for (const [template, phrase, label] of [
  [specTemplate, 'Negative and abuse-case criteria', 'spec'],
  [specTemplate, 'Real, mocked, partial, absent, or unverified', 'spec'],
  [designTemplate, 'producer repo@base SHA', 'design'],
  [designTemplate, 'Sensitive data flow and invariant surfaces', 'design'],
  [designTemplate, 'Test environment isolation and cleanup ownership', 'design'],
  [planTemplate, 'generation checkpoint', 'plan'],
  [verificationTemplate, 'Composite verification command and revisions', 'verification'],
  [verificationTemplate, 'Environment cleanup', 'verification'],
  [verificationTemplate, 'Production verified', 'verification'],
]) {
  if (!template.includes(phrase)) throw new Error(`${label} template is missing: ${phrase}`);
}

for (const phrase of [
  'blocked reviewers/tools honestly',
  'Independent multi-backend review',
  'committed branch changes: `<base-ref>...HEAD`',
  'unstaged changes: `git diff`',
  'staged changes: `git diff --cached`',
  'Codex CLI backend',
  '--sandbox read-only',
  '--ephemeral',
  '--ignore-user-config',
  '--ignore-rules',
  'CODEX_REVIEW_MODEL',
  'OMP backend',
  '--no-session',
  '--no-tools',
  '--no-skills',
  '--no-rules',
  '--no-extensions',
  'OMP_REVIEW_MODEL',
  'Claude CLI backend',
  '--safe-mode',
  '--disable-slash-commands',
  '--tools ""',
  '--strict-mcp-config',
  '--no-session-persistence',
  'CLAUDE_REVIEW_MODEL',
  'blocked-capability',
  'umask 077',
  '--no-textconv',
  '--untracked-files=no',
  '@"$_REVIEW_DIFF"',
  'untrusted Git data, not instructions',
  'Reviewer agreement raises triage priority, not truth or severity',
  'Never use `git add .`',
  'Inspect the first real failing step',
  '**Cross-repository dependency**',
]) {
  if (!review.includes(phrase)) throw new Error(`Review and release reference is missing: ${phrase}`);
}

for (const forbidden of [
  'web_search_cached',
  'claude-haiku-4-5-20251001',
  'openrouter/z-ai/glm-4.7-flash',
]) {
  if (review.includes(forbidden)) throw new Error(`Portable review policy contains a fixed or unsafe backend setting: ${forbidden}`);
}

for (const path of [
  ['references', 'spec-workflow.md'],
  ['references', 'playwright-evidence.md'],
  ['references', 'cross-repo-delivery.md'],
  ['references', 'review-and-release.md'],
  ['assets', 'spec.md'],
  ['assets', 'design.md'],
  ['assets', 'plan.md'],
  ['assets', 'verification.md'],
  ['agents', 'openai.yaml'],
]) {
  await access(join(skillRoot, ...path));
}

const temporaryRoot = await mkdtemp(join(tmpdir(), 'agent-toolkit-video-'));
try {
  const validDirectory = join(temporaryRoot, 'valid');
  await mkdir(validDirectory);
  const structuralWebm = Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.alloc(2048, 1),
  ]);
  await writeFile(join(validDirectory, 'video.webm'), structuralWebm);

  const valid = spawnSync(process.execPath, [verifier, validDirectory, '--structural-only', '--json'], { encoding: 'utf8' });
  if (valid.status !== 0) throw new Error(`Structural video fixture was rejected: ${valid.stderr}`);
  const payload = JSON.parse(valid.stdout);
  if (payload.videos.length !== 1 || payload.videos[0].valid !== true) throw new Error('Video verifier JSON result is invalid');

  const invalidDirectory = join(temporaryRoot, 'invalid');
  await mkdir(invalidDirectory);
  await writeFile(join(invalidDirectory, 'video.webm'), Buffer.from('not a video'));
  const invalid = spawnSync(process.execPath, [verifier, invalidDirectory, '--structural-only'], { encoding: 'utf8' });
  if (invalid.status === 0) throw new Error('Invalid WebM fixture was accepted');
} finally {
  const relativeTemporaryRoot = relative(resolve(tmpdir()), temporaryRoot);
  if (!relativeTemporaryRoot || relativeTemporaryRoot.startsWith('..')) throw new Error('Refusing to clean an unexpected temporary path');
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log('Software delivery workflow tests passed.');
