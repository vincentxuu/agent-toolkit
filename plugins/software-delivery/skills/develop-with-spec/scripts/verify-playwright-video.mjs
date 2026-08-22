#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { lstat, open, readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const structuralOnly = rawArgs.includes('--structural-only');
const jsonOutput = rawArgs.includes('--json');
const positional = rawArgs.filter((arg) => !arg.startsWith('--'));

if (positional.length !== 1 || rawArgs.some((arg) => arg.startsWith('--') && !['--structural-only', '--json'].includes(arg))) {
  console.error('Usage: verify-playwright-video.mjs <video-or-directory> [--structural-only] [--json]');
  process.exit(2);
}

const target = resolve(positional[0]);

async function collect(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) return [];
  if (stat.isFile()) return extname(path).toLowerCase() === '.webm' ? [path] : [];
  if (!stat.isDirectory()) return [];
  const results = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    results.push(...await collect(join(path, entry.name)));
  }
  return results;
}

async function inspect(path) {
  const stat = await lstat(path);
  const handle = await open(path, 'r');
  const signature = Buffer.alloc(4);
  await handle.read(signature, 0, 4, 0);
  await handle.close();
  const structural = stat.size >= 1024 && signature.equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  const sha256 = hash.digest('hex');
  let durationSeconds = null;
  let probe = structuralOnly ? 'skipped' : 'unavailable';

  if (!structuralOnly) {
    const result = spawnSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      path,
    ], { encoding: 'utf8' });
    if (!result.error) {
      durationSeconds = Number.parseFloat(result.stdout.trim());
      probe = result.status === 0 && Number.isFinite(durationSeconds) && durationSeconds > 0 ? 'passed' : 'failed';
    }
  }

  return {
    path,
    bytes: stat.size,
    sha256,
    structural,
    probe,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    valid: structural && probe !== 'failed',
  };
}

let videos;
try {
  videos = await collect(target);
} catch (error) {
  console.error(`Video target cannot be read: ${error.message}`);
  process.exit(1);
}

if (videos.length === 0) {
  console.error(`No .webm videos found under ${target}`);
  process.exit(1);
}

const results = [];
for (const video of videos.sort()) results.push(await inspect(video));

if (jsonOutput) {
  console.log(JSON.stringify({ target, videos: results }, null, 2));
} else {
  for (const result of results) {
    const duration = result.durationSeconds === null ? 'unknown' : `${result.durationSeconds.toFixed(3)}s`;
    console.log(`${result.valid ? 'PASS' : 'FAIL'} ${result.path}`);
    console.log(`  bytes=${result.bytes} sha256=${result.sha256}`);
    console.log(`  structural=${result.structural ? 'passed' : 'failed'} ffprobe=${result.probe} duration=${duration}`);
  }
}

if (results.some((result) => !result.valid)) process.exit(1);
