#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const verifyReportPath = resolve(process.env.EDITOR_VERIFY_REPORT || join(rootDir, 'output/playwright/verify-extension-editor-report.json'));
const visualSummaryPath = resolve(process.env.EDITOR_VISUAL_SUMMARY || join(rootDir, 'output/hancom-oracle/extension-visual-current/visual-fidelity-summary.json'));

const REQUIRED_SAMPLES = new Map([
  ['goyeopje', { pages: 2, format: 'HWP' }],
  ['goyeopje-full-2024', { pages: 11, format: 'HWP' }],
  ['gyeolseokgye', { pages: 1, format: 'HWP' }],
  ['attachment-sale-notice', { pages: 4, format: 'HWP' }],
  ['incheon-2a', { pages: 18, format: 'HWPX' }]
]);

const failures = [];
const warnings = [];
const checks = [];

function main() {
  const verifyReport = readJson(verifyReportPath, 'extension verification report');
  const visualSummary = readJson(visualSummaryPath, 'visual fidelity summary');

  checkExtensionVerification(verifyReport);
  checkRoundTrip(verifyReport?.roundTrip);
  checkVisualFidelity(visualSummary);

  for (const check of checks) {
    console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}${check.detail ? ` - ${check.detail}` : ''}`);
  }

  if (warnings.length) {
    console.log('\nWarnings');
    for (const warning of warnings) console.log(`- ${warning}`);
  }
  if (failures.length) {
    console.log('\nCompletion gate failed');
    for (const failure of failures) console.log(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('\nEditor completion gate passed.');
}

function readJson(path, label) {
  if (!existsSync(path)) {
    fail(`${label} missing: ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${path} (${error?.message || error})`);
    return null;
  }
}

function checkExtensionVerification(report) {
  if (!report) return;
  record('extension verification report is green', report.ok === true, report.generatedAt || '');
  if (report.failures?.length) fail(`extension failures: ${report.failures.join('; ')}`);
  if (report.warnings?.length) fail(`extension warnings: ${report.warnings.join('; ')}`);

  const results = new Map((report.results || []).map((result) => [result.key, result]));
  for (const [key, expected] of REQUIRED_SAMPLES) {
    const result = results.get(key);
    const ok = result?.ok === true
      && result.pages === expected.pages
      && result.formatKind === expected.format
      && result.overflowingBlocks === 0
      && result.topLevelOverlaps === 0
      && result.missingImages === 0;
    record(`${key} structural render`, ok, result
      ? `format=${result.formatKind}, pages=${result.pages}, overflow=${result.overflowingBlocks}, overlaps=${result.topLevelOverlaps}, missingImages=${result.missingImages}`
      : 'missing');
    if (!ok) fail(`${key} structural render does not meet completion criteria`);
  }
}

function checkRoundTrip(roundTrip) {
  if (!roundTrip) {
    fail('HWPX roundtrip result missing');
    return;
  }

  const sourceImages = roundTrip.source?.imageInventory;
  const reopenedImages = roundTrip.reopened?.imageInventory;
  const hwpxImages = roundTrip.hwpxImages || {};
  const ok = roundTrip.ok === true
    && roundTrip.reopened?.markerFound === true
    && roundTrip.reopened?.pages === roundTrip.source?.pages
    && sourceImages?.total === reopenedImages?.total
    && sourceImages?.readonly === reopenedImages?.readonly
    && hwpxImages.picCount >= (reopenedImages?.exportable ?? 0)
    && hwpxImages.uniqueBinaryRefs === hwpxImages.binItems
    && hwpxImages.paraStyleCount > 0
    && hwpxImages.usedParaStyleCount === hwpxImages.paraStyleCount
    && hwpxImages.intentCount > 0
    && hwpxImages.hyperlinkFieldCount > 0
    && hwpxImages.hyperlinkFieldEndCount === hwpxImages.hyperlinkFieldCount
    && hwpxImages.hyperlinkPathCount === hwpxImages.hyperlinkFieldCount
    && !hwpxImages.missingContentHpfFiles?.length;

  record('HWPX edit/export/reopen roundtrip', ok, [
    `pages=${roundTrip.source?.pages}->${roundTrip.reopened?.pages}`,
    `images=${sourceImages?.total}->${reopenedImages?.total}`,
    `paraStyles=${hwpxImages.paraStyleCount}/${hwpxImages.usedParaStyleCount}`,
    `hyperlinks=${hwpxImages.hyperlinkFieldCount}`
  ].join(', '));
  if (!ok) fail('HWPX roundtrip does not preserve required editor data');
}

function checkVisualFidelity(summary) {
  if (!summary?.summary) return;
  record('strict visual run has no strict failures', summary.summary.strictFailures?.length === 0, summary.generatedAt || '');
  if (summary.summary.strictFailures?.length) {
    fail(`strict visual failures: ${summary.summary.strictFailures.join('; ')}`);
  }

  const advisoryPages = [];
  const cleanDocuments = [];
  for (const doc of summary.summary.documents || []) {
    const counts = doc.verdictCounts || {};
    const advisoryCount = (counts.review || 0) + (counts['layout-review'] || 0);
    const failureCount = Object.entries(counts)
      .filter(([verdict]) => !['close', 'review', 'layout-review'].includes(verdict))
      .reduce((sum, [, count]) => sum + count, 0);
    if (advisoryCount > 0) advisoryPages.push(`${doc.filename}: ${advisoryCount}`);
    if (failureCount > 0) fail(`${doc.filename} has non-clean visual verdicts: ${JSON.stringify(counts)}`);
    cleanDocuments.push({ filename: doc.filename, advisoryCount, counts });
  }

  const cleanVisual = advisoryPages.length === 0;
  record('Hancom visual fidelity clean pass', cleanVisual, advisoryPages.length
    ? `advisory pages remain (${advisoryPages.join(', ')})`
    : cleanDocuments.map((doc) => `${doc.filename}=${JSON.stringify(doc.counts)}`).join('; '));
  if (!cleanVisual) {
    fail('visual advisory pages remain; editor is not complete for Hancom-level fidelity');
  }
}

function record(label, ok, detail = '') {
  checks.push({ label, ok, detail });
}

function fail(message) {
  failures.push(message);
}

main();
