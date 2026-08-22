#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(root, 'dist');

async function filesUnder(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(child));
    else if (entry.isFile() && entry.name !== 'SHA256SUMS') result.push(child);
  }
  return result;
}

const lines = [];
for (const path of (await filesUnder(distRoot)).sort()) {
  const digest = createHash('sha256').update(await readFile(path)).digest('hex');
  lines.push(`${digest}  ${relative(distRoot, path).split(sep).join('/')}`);
}
await writeFile(join(distRoot, 'SHA256SUMS'), `${lines.join('\n')}\n`);
console.log(`Wrote checksums for ${lines.length} files.`);
