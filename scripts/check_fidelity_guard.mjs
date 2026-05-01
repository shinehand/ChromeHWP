#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const VERIFY_REPORT_PATH = process.env.VERIFY_REPORT_PATH
  || path.join(ROOT_DIR, 'output', 'playwright', 'verify-samples-report.json');
const HANCOM_PAGE_AUDIT_REPORT_PATH = process.env.HANCOM_PAGE_AUDIT_REPORT_PATH
  || path.join(ROOT_DIR, 'output', 'hancom-oracle', 'extension-visual-current', 'hancom-page-audit-report.json');
const STRICT_VISUAL_FIDELITY = process.env.STRICT_VISUAL_FIDELITY === '1';
const REQUIRE_VISUAL_AUDIT = process.env.FIDELITY_REQUIRE_VISUAL_AUDIT === '1' || STRICT_VISUAL_FIDELITY;
const VISUAL_MAX_AGE_HOURS = Number(process.env.FIDELITY_VISUAL_MAX_AGE_HOURS || 24);
const DEFAULT_SCREENSHOT_DIR = path.join(ROOT_DIR, 'output', 'playwright', 'qa-snapshots');
const STRICT_FAILURE_VERDICTS = new Set(['mismatch', 'capture-error', 'capture-review']);
const ADVISORY_VERDICTS = new Set(['review', 'layout-review']);
const PASS_VERDICTS = new Set(['close']);

function readJson(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} 파일이 없습니다: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asMetricNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMetric(value) {
  const number = asMetricNumber(value);
  return number === null ? 'n/a' : number.toFixed(3);
}

function parseTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function pushVisualAuditIssue(warnings, failures, message) {
  if (REQUIRE_VISUAL_AUDIT) failures.push(message);
  else warnings.push(message);
}

function pushFailure(failures, report, message) {
  failures.push(`${report.filename || report.id || 'unknown'}: ${message}`);
}

function uniquePaths(paths) {
  return [...new Set(paths.filter(Boolean))];
}

function countVerdicts(counts, verdicts) {
  return Object.entries(counts || {})
    .filter(([verdict]) => verdicts.has(verdict))
    .reduce((sum, [, count]) => sum + (Number(count) || 0), 0);
}

function formatVerdictCounts(counts, verdicts) {
  const parts = Object.entries(counts || {})
    .filter(([verdict, count]) => verdicts.has(verdict) && Number(count) > 0)
    .map(([verdict, count]) => `${verdict}=${count}`);
  return parts.length ? parts.join(', ') : 'none';
}

function pageRawDiff(page) {
  return asMetricNumber(page?.visualMetrics?.rawDiff ?? page?.diff);
}

function pageBlurDiff(page) {
  return asMetricNumber(page?.visualMetrics?.blurDiff);
}

function pageLayoutDiff(page) {
  return asMetricNumber(page?.visualMetrics?.projectionDiff?.combined);
}

function formatPageMetrics(page) {
  return [
    `raw=${formatMetric(pageRawDiff(page))}`,
    `blur=${formatMetric(pageBlurDiff(page))}`,
    `layout=${formatMetric(pageLayoutDiff(page))}`,
  ].join(', ');
}

function formatVisualPage(page) {
  const pageNumber = Number(page?.pageIndex) + 1;
  const pageLabel = Number.isFinite(pageNumber) ? `p${pageNumber}` : 'p?';
  const compare = page?.pageCompare ? `, compare=${page.pageCompare}` : '';
  return `${pageLabel} ${page?.verdict || 'unknown'} (${formatPageMetrics(page)}${compare})`;
}

function worstPagesByRawDiff(pages, limit = 5) {
  return [...pages]
    .sort((left, right) => (pageRawDiff(right) ?? -Infinity) - (pageRawDiff(left) ?? -Infinity))
    .slice(0, limit);
}

function formatWorstPages(pages, limit = 5) {
  if (!pages.length) return '';
  const selected = worstPagesByRawDiff(pages, limit).map((page) => formatVisualPage(page));
  const remaining = pages.length - selected.length;
  return `${selected.join('; ')}${remaining > 0 ? `; +${remaining} more` : ''}`;
}

function resolveReportArtifactPath(filePath, options = {}) {
  if (!filePath) return null;

  const fallbackDir = options.fallbackDir || '';
  const basename = path.basename(filePath);
  const candidates = uniquePaths([
    path.isAbsolute(filePath) ? filePath : null,
    path.resolve(ROOT_DIR, filePath),
    path.resolve(path.dirname(VERIFY_REPORT_PATH), filePath),
    fallbackDir ? path.join(fallbackDir, basename) : null,
  ]);

  return candidates.find((candidate) => existsSync(candidate)) || candidates[0] || null;
}

function resolveScreenshotPath(report) {
  return resolveReportArtifactPath(report?.screenshotPath || '', { fallbackDir: DEFAULT_SCREENSHOT_DIR });
}

function verifyReport(report, failures, options = {}) {
  const requireScreenshot = options.requireScreenshot !== false;

  if (report.fatal) {
    pushFailure(failures, report, `로드 실패: ${report.fatal}`);
    return;
  }

  if (Array.isArray(report.issues) && report.issues.length) {
    pushFailure(failures, report, `검증 이슈: ${report.issues.join(' / ')}`);
  }

  const pageCount = asNumber(report.pageCount);
  if (!pageCount || pageCount < 1) {
    pushFailure(failures, report, `페이지 수 비정상: ${report.pageCount}`);
  }

  if (Number.isFinite(report.hancomExpectedPages) && report.hancomPageMatch !== true) {
    pushFailure(
      failures,
      report,
      `한컴 페이지 기준 불일치: expected=${report.hancomExpectedPages}, actual=${report.pageCount}`,
    );
  }

  if (report.diagnosticPageMatch !== true) {
    pushFailure(
      failures,
      report,
      `상태바/진단 페이지 수 불일치: status=${report.pageCount}, diagnostics=${report.diagnosticPageCount}`,
    );
  }

  if (pageCount && report.pageElementCount !== pageCount) {
    pushFailure(
      failures,
      report,
      `DOM 페이지 수 불일치: status=${pageCount}, dom=${report.pageElementCount}`,
    );
  }

  if (pageCount && report.thumbnailCount > 0 && report.thumbnailCount < pageCount) {
    pushFailure(
      failures,
      report,
      `썸네일 수 부족: pages=${pageCount}, thumbnails=${report.thumbnailCount}`,
    );
  }

  if (report.renderedGeometryMatch !== true) {
    const expected = report.renderedGeometry?.expectedFirstPage;
    const actual = report.renderedGeometry?.actualFirstPage;
    pushFailure(
      failures,
      report,
      `첫 페이지 용지 치수 불일치: expected=${expected?.width}x${expected?.height}, actual=${actual?.width}x${actual?.height}`,
    );
  }

  const screenshotPath = resolveScreenshotPath(report);
  if (requireScreenshot && !screenshotPath) {
    pushFailure(failures, report, `스크린샷 누락: ${report.screenshotPath || '(none)'}`);
  }
}

function summarizeScreenshotArtifacts(verifyPayload) {
  const reports = Array.isArray(verifyPayload.reports) ? verifyPayload.reports : [];
  const summary = {
    documents: reports.length,
    present: 0,
    missing: 0,
    missingFiles: [],
  };

  for (const report of reports) {
    const screenshotPath = resolveScreenshotPath(report);
    if (screenshotPath) {
      summary.present += 1;
    } else {
      summary.missing += 1;
      summary.missingFiles.push({ filename: report.filename || report.id || 'unknown', screenshotPath: report.screenshotPath || '(none)' });
    }
  }

  return summary;
}

function summarizeStructuralAudit(verifyPayload) {
  const reports = Array.isArray(verifyPayload.reports) ? verifyPayload.reports : [];
  const summary = {
    documents: reports.length,
    passed: 0,
    failed: 0,
    failedFiles: [],
  };

  for (const report of reports) {
    const structuralIssues = [];
    verifyReport(report, structuralIssues, { requireScreenshot: false });
    if (structuralIssues.length) {
      summary.failed += 1;
      summary.failedFiles.push({ filename: report.filename || report.id || 'unknown', issues: structuralIssues });
    } else {
      summary.passed += 1;
    }
  }

  return summary;
}

function summarizeVisualAudit(warnings, failures, verifyPayload) {
  const summary = {
    checked: false,
    documents: 0,
    pages: 0,
    passPages: 0,
    advisoryPages: 0,
    strictFailurePages: 0,
  };

  if (!existsSync(HANCOM_PAGE_AUDIT_REPORT_PATH)) {
    const message = `한컴 페이지 감사 리포트가 없습니다: ${HANCOM_PAGE_AUDIT_REPORT_PATH}`;
    if (REQUIRE_VISUAL_AUDIT) failures.push(message);
    else warnings.push(message);
    return summary;
  }

  const audit = readJson(HANCOM_PAGE_AUDIT_REPORT_PATH, '한컴 페이지 감사 리포트');
  summary.checked = true;
  const auditGeneratedAt = parseTimestamp(audit.generatedAt);
  const verifyGeneratedAt = verifyPayload.generatedAt;
  const verifyDate = parseTimestamp(verifyGeneratedAt);
  if (!auditGeneratedAt) {
    pushVisualAuditIssue(warnings, failures, '한컴 페이지 감사 리포트 generatedAt을 읽을 수 없습니다.');
  } else {
    if (verifyDate && auditGeneratedAt < verifyDate) {
      pushVisualAuditIssue(
        warnings,
        failures,
        `한컴 페이지 감사 리포트가 검증 리포트보다 오래되었습니다: visual=${audit.generatedAt}, verify=${verifyGeneratedAt}`,
      );
    }

    if (Number.isFinite(VISUAL_MAX_AGE_HOURS) && VISUAL_MAX_AGE_HOURS > 0) {
      const ageHours = (Date.now() - auditGeneratedAt.getTime()) / 36e5;
      if (ageHours > VISUAL_MAX_AGE_HOURS) {
        pushVisualAuditIssue(
          warnings,
          failures,
          `한컴 페이지 감사 리포트가 너무 오래되었습니다: ${ageHours.toFixed(1)}h > ${VISUAL_MAX_AGE_HOURS}h`,
        );
      }
    }
  }

  const results = Array.isArray(audit.results) ? audit.results : [];
  if (!results.length) {
    const message = '한컴 페이지 감사 리포트가 비어 있습니다.';
    if (REQUIRE_VISUAL_AUDIT) failures.push(message);
    else warnings.push(message);
    return summary;
  }
  summary.documents = results.length;

  const verifyReports = Array.isArray(verifyPayload.reports) ? verifyPayload.reports : [];
  const auditByFilename = new Map(results.map((doc) => [doc.filename, doc]));
  for (const report of verifyReports) {
    if (!report.filename) continue;
    const auditDoc = auditByFilename.get(report.filename);
    if (!auditDoc) {
      pushVisualAuditIssue(warnings, failures, `${report.filename}: 한컴 페이지 감사 대상에서 누락되었습니다.`);
      continue;
    }
    if (Number.isFinite(report.pageCount) && Number.isFinite(auditDoc.pageCount) && report.pageCount !== auditDoc.pageCount) {
      pushVisualAuditIssue(
        warnings,
        failures,
        `${report.filename}: 검증/한컴 감사 페이지 수 불일치 verify=${report.pageCount}, visual=${auditDoc.pageCount}`,
      );
    }
  }

  for (const doc of results) {
    const counts = doc.verdictCounts || {};
    const pages = Array.isArray(doc.pages) ? doc.pages : [];
    const badPages = pages.filter((page) => STRICT_FAILURE_VERDICTS.has(page.verdict));
    const advisoryPages = pages.filter((page) => ADVISORY_VERDICTS.has(page.verdict));
    const badCount = badPages.length || countVerdicts(counts, STRICT_FAILURE_VERDICTS);
    const advisoryCount = advisoryPages.length || countVerdicts(counts, ADVISORY_VERDICTS);
    const passCount = countVerdicts(counts, PASS_VERDICTS);
    summary.pages += pages.length || Object.values(counts).reduce((sum, count) => sum + (Number(count) || 0), 0);
    summary.passPages += passCount;
    summary.advisoryPages += advisoryCount;
    summary.strictFailurePages += badCount;

    if (badCount > 0) {
      const details = badPages.length ? `; worst ${formatWorstPages(badPages)}` : '';
      const message = `${doc.filename}: 한컴 이미지 감사 strict failure ${badCount}쪽 (${formatVerdictCounts(counts, STRICT_FAILURE_VERDICTS)})${details}`;
      pushVisualAuditIssue(warnings, failures, message);
    }
    if (advisoryCount > 0) {
      const details = advisoryPages.length ? `; worst ${formatWorstPages(advisoryPages)}` : '';
      warnings.push(
        `${doc.filename}: 한컴 이미지 감사 advisory ${advisoryCount}쪽 (${formatVerdictCounts(counts, ADVISORY_VERDICTS)}) - review/layout-review는 clean pass가 아니라 수동 검토 필요 상태입니다${details}`,
      );
    }
  }

  return summary;
}

function main() {
  const verifyPayload = readJson(VERIFY_REPORT_PATH, '샘플 검증 리포트');
  const reports = Array.isArray(verifyPayload.reports) ? verifyPayload.reports : [];
  const failures = [];
  const warnings = [];

  if (!reports.length) {
    failures.push(`검증 대상 리포트가 비어 있습니다: ${VERIFY_REPORT_PATH}`);
  }

  for (const report of reports) {
    verifyReport(report, failures);
  }
  const structuralSummary = summarizeStructuralAudit(verifyPayload);
  const screenshotSummary = summarizeScreenshotArtifacts(verifyPayload);
  const visualSummary = summarizeVisualAudit(warnings, failures, verifyPayload);

  console.log(`Fidelity guard: ${reports.length} document(s) checked`);
  console.log(`- verify report: ${VERIFY_REPORT_PATH}`);
  console.log(`- visual audit: ${HANCOM_PAGE_AUDIT_REPORT_PATH}`);
  console.log(`- require visual audit: ${REQUIRE_VISUAL_AUDIT ? 'yes' : 'no'}`);
  console.log(`- strict visual env: ${STRICT_VISUAL_FIDELITY ? 'yes' : 'no'}`);
  console.log(`- visual max age hours: ${VISUAL_MAX_AGE_HOURS}`);
  console.log(`- structural pass: ${structuralSummary.passed}/${structuralSummary.documents}`);
  console.log(`- structural fail: ${structuralSummary.failed}/${structuralSummary.documents}`);
  console.log(`- screenshots present: ${screenshotSummary.present}/${screenshotSummary.documents}`);
  console.log(`- screenshots missing: ${screenshotSummary.missing}/${screenshotSummary.documents}`);
  if (visualSummary.checked) {
    console.log(
      `- visual verdict pages: pass=${visualSummary.passPages}, advisory=${visualSummary.advisoryPages}, strict-failure=${visualSummary.strictFailurePages}, total=${visualSummary.pages}`,
    );
    if (visualSummary.advisoryPages > 0) {
      console.log('- visual advisory status: review/layout-review는 성공 판정이 아니라 raw/blur/layout 확인이 필요한 상태입니다.');
    }
  }

  if (screenshotSummary.missingFiles.length) {
    console.log('\nScreenshot artifacts');
    for (const item of screenshotSummary.missingFiles) {
      console.log(`- ${item.filename}: ${item.screenshotPath}`);
    }
  }

  if (structuralSummary.failedFiles.length) {
    console.log('\nStructural summary');
    for (const item of structuralSummary.failedFiles) {
      console.log(`- ${item.filename}`);
      for (const issue of item.issues) {
        console.log(`  - ${issue}`);
      }
    }
  }

  if (warnings.length) {
    console.log('\nWarnings');
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (failures.length) {
    console.error('\nFailures');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  if (warnings.length) {
    console.log('\n! Fidelity guard completed with warnings/advisories; this is not a clean visual pass.');
  } else {
    console.log('\n✓ Fidelity guard passed without warnings');
  }
}

main();
