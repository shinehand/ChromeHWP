#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceDir = join(rootDir, 'src');

const SOURCE_EXTENSIONS = new Set(['.css', '.html', '.js', '.jsx', '.ts', '.tsx']);
const PROHIBITED_PATTERNS = [
  /goyeopje/iu,
  /gyeolseokgye/iu,
  /incheon-2a/iu,
  /attachment-sale-notice/iu,
  /sale-notice/iu,
  /lh-sale/iu,
  /잔여세대/iu,
  /일반매각/iu,
  /신혼희망타운/iu,
  /공급규모/iu,
  /성능등급/iu,
  /분양가상한제/iu
];

const ALLOWED_PATTERNS = [
  /hwpx-body-container/iu
];

const findings = [];

for (const filePath of walk(sourceDir)) {
  if (!SOURCE_EXTENSIONS.has(extname(filePath))) continue;
  const source = readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/u);
  lines.forEach((line, index) => {
    if (ALLOWED_PATTERNS.some((pattern) => pattern.test(line))) return;
    const pattern = PROHIBITED_PATTERNS.find((candidate) => candidate.test(line));
    if (!pattern) return;
    findings.push({
      file: relative(rootDir, filePath),
      line: index + 1,
      pattern: pattern.source,
      text: line.trim()
    });
  });
}

if (findings.length) {
  console.error('Production source contains sample-specific rendering predicates or text.');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} /${finding.pattern}/ ${finding.text}`);
  }
  process.exit(1);
}

console.log('OK production source has no known sample-specific rendering predicates.');

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      yield* walk(path);
    } else if (stat.isFile()) {
      yield path;
    }
  }
}
