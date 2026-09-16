import { gzipSync } from 'node:zlib';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ASSETS_DIR = path.resolve('dist/assets');

const budgets = [
  {
    name: 'main application JS',
    pattern: /^index-.*\.js$/,
    maxBytes: 450 * 1024,
    maxGzipBytes: 145 * 1024,
  },
  {
    name: 'lazy map JS',
    pattern: /^MapVisualization-.*\.js$/,
    maxBytes: 70 * 1024,
    maxGzipBytes: 25 * 1024,
  },
];

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

const files = await readdir(ASSETS_DIR);
const failures = [];

for (const budget of budgets) {
  const fileName = files.find((file) => budget.pattern.test(file));
  if (!fileName) {
    failures.push(`${budget.name}: no matching bundle found`);
    continue;
  }

  const filePath = path.join(ASSETS_DIR, fileName);
  const fileStats = await stat(filePath);
  const fileBuffer = await readFile(filePath);
  const gzipBytes = gzipSync(fileBuffer).byteLength;

  console.log(
    `${budget.name}: ${fileName} ${formatKb(fileStats.size)} raw, ${formatKb(gzipBytes)} gzip`,
  );

  if (fileStats.size > budget.maxBytes) {
    failures.push(`${budget.name}: ${formatKb(fileStats.size)} exceeds ${formatKb(budget.maxBytes)} raw budget`);
  }
  if (gzipBytes > budget.maxGzipBytes) {
    failures.push(`${budget.name}: ${formatKb(gzipBytes)} exceeds ${formatKb(budget.maxGzipBytes)} gzip budget`);
  }
}

if (failures.length > 0) {
  console.error('\nBundle budget failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Bundle budget passed.');
