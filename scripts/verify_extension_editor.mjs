#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = join(rootDir, 'dist');
const editorPath = join(distDir, 'src/editor/editor.html');
const pwcli = process.env.PWCLI || join(process.env.CODEX_HOME || join(process.env.HOME || '', '.codex'), 'skills/playwright/scripts/playwright_cli.sh');
const session = process.env.PLAYWRIGHT_CLI_SESSION || `ext-${Date.now().toString(36)}`;
const strictPageExpectations = process.env.STRICT_PAGE_EXPECTATIONS === '1';
const baselinePath = process.env.HANCOM_ORACLE_BASELINE_PATH || join(rootDir, 'docs/hancom-oracle-page-baseline.json');
const reportPath = process.env.EXTENSION_VERIFY_REPORT_PATH || join(rootDir, 'output/playwright/verify-extension-editor-report.json');
const markdownReportPath = process.env.EXTENSION_VERIFY_MARKDOWN_PATH || join(rootDir, 'output/playwright/verify-extension-editor-report.md');
const roundTripOutputPath = process.env.EXTENSION_VERIFY_ROUNDTRIP_PATH
  || join(rootDir, 'output/playwright/served-inputs/incheon-2a-editor-roundtrip.hwpx');
const browserTimeoutMs = Number(process.env.EXTENSION_VERIFY_BROWSER_TIMEOUT_MS || 30000);
const commandTimeoutMs = Number(process.env.EXTENSION_VERIFY_COMMAND_TIMEOUT_MS || 120000);

const baseline = loadBaseline();
const samples = buildSamples();

function buildSamples() {
  return [
    {
      key: 'goyeopje',
      label: 'HWP goyeopje',
      path: resolve(process.env.GOYEOPJE_SAMPLE || process.argv[3] || join(rootDir, 'output/playwright/inputs/goyeopje.hwp')),
      expectedFormat: 'HWP',
      minParagraphs: 80,
      minTables: 1,
      minImages: 0
    },
    {
      key: 'goyeopje-full-2024',
      label: 'HWP goyeopje-full-2024',
      path: resolve(process.env.GOYEOPJE_FULL_SAMPLE || join(rootDir, 'output/playwright/inputs/goyeopje-full-2024.hwp')),
      expectedFormat: 'HWP',
      minParagraphs: 500,
      minTables: 10,
      minImages: 0
    },
    {
      key: 'gyeolseokgye',
      label: 'HWP gyeolseokgye',
      path: resolve(process.env.GYEOLSEOKGYE_SAMPLE || join(rootDir, 'output/playwright/inputs/gyeolseokgye.hwp')),
      expectedFormat: 'HWP',
      minParagraphs: 40,
      minTables: 2,
      minImages: 0
    },
    {
      key: 'attachment-sale-notice',
      label: 'HWP attachment-sale-notice',
      path: resolve(process.env.ATTACHMENT_HWP_SAMPLE || process.argv[4] || join(rootDir, 'output/playwright/inputs/attachment-sale-notice.hwp')),
      expectedFormat: 'HWP',
      minParagraphs: 300,
      minTables: 8,
      minImages: 1
    },
    {
      key: 'incheon-2a',
      label: 'HWPX incheon-2a',
      path: resolve(process.env.HWPX_SAMPLE || process.argv[2] || join(rootDir, 'output/playwright/inputs/incheon-2a.hwpx')),
      expectedFormat: 'HWPX',
      minParagraphs: 800,
      minTables: 20,
      minImages: 4
    }
  ].map((sample) => hydrateSampleExpectation(sample));
}

function hydrateSampleExpectation(sample) {
  const baselineDoc = baseline.documents?.[sample.key] || {};
  const smoke = baselineDoc.extensionEditorSmoke || {};
  return {
    ...sample,
    expectedPages: Number(smoke.expectedPages || baselineDoc.hancomPageCount || sample.expectedPages || 0),
    minParagraphs: Number(smoke.minimumParagraphs || sample.minParagraphs || 0),
    minTables: Number(smoke.minimumTables || sample.minTables || 0),
    minImages: Number(smoke.minimumImages || sample.minImages || 0),
    referenceCounts: smoke.referenceCounts || null
  };
}

function loadBaseline() {
  if (!existsSync(baselinePath)) return { documents: {} };
  try {
    return JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch (error) {
    throw new Error(`한컴 기준선 파일을 읽지 못했습니다: ${baselinePath}\n${error instanceof Error ? error.message : String(error)}`);
  }
}

const expectedSummary = samples.map((sample) => ({
  key: sample.key,
  label: sample.label,
  path: sample.path,
  expectedFormat: sample.expectedFormat,
  expectedPages: sample.expectedPages,
  minimumParagraphs: sample.minParagraphs,
  minimumTables: sample.minTables,
  minimumImages: sample.minImages,
  referenceCounts: sample.referenceCounts
}));

for (const filePath of [editorPath, pwcli, ...samples.map((sample) => sample.path)]) {
  if (!existsSync(filePath)) {
    throw new Error(`필수 파일을 찾지 못했습니다: ${filePath}`);
  }
}

void runVerification();

async function runVerification() {
  const port = await findFreePort();
  const staticServer = startStaticServer(port);
  const url = `http://127.0.0.1:${port}/src/editor/editor.html`;
  try {
    await waitForHttpServer(url);
    runPw([`-s=${session}`, 'open', url]);
    const probe = runEditorProbe(url);
    if (probe.roundTrip?.outputPath && existsSync(probe.roundTrip.outputPath)) {
      probe.roundTrip.hwpxImages = inspectHwpxImages(probe.roundTrip.outputPath);
    }
    const evaluation = evaluateProbeResult(probe.results, probe.roundTrip);
    const consoleOutput = runPw([`-s=${session}`, 'console']);
    if (/Errors:\s*[1-9]/.test(consoleOutput) || /\[ERROR\]/.test(consoleOutput)) {
      evaluation.failures.push(`브라우저 콘솔 오류가 남아 있습니다.\n${consoleOutput}`);
    }

    const payload = {
      ok: evaluation.failures.length === 0,
      generatedAt: new Date().toISOString(),
      url,
      session,
      strictPageExpectations,
      baselinePath,
      distDir,
      expectations: expectedSummary,
      results: evaluation.results,
      roundTrip: probe.roundTrip,
      warnings: evaluation.warnings,
      failures: evaluation.failures
    };
    writeReports(payload);
    console.log(JSON.stringify(payload, null, 2));
    if (payload.failures.length) {
      throw new Error(`확장 에디터 검증 실패 ${payload.failures.length}건\n${payload.failures.join('\n')}`);
    }
  } finally {
    try {
      runPw([`-s=${session}`, 'close']);
    } catch (error) {
      console.warn(`Playwright 세션 정리 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!staticServer.killed) staticServer.kill();
  }
}

function runEditorProbe(url) {
  const code = `async (page) => {
    await page.goto(${JSON.stringify(url)}, { waitUntil: "domcontentloaded", timeout: 15000 });
    const samples = ${JSON.stringify(samples)};
    const timeoutMs = ${JSON.stringify(browserTimeoutMs)};
    const output = [];
    const roundTripOutputPath = ${JSON.stringify(roundTripOutputPath)};
    const roundTripMarker = "Codex roundtrip marker 2026-04-30";
    const sleep = (ms) => page.waitForTimeout(ms);
    const sampleFilename = (sample) => sample.path.split(/[\\\\/]/).pop();
    const collectState = async (sample) => {
      const domState = await page.evaluate(() => {
        const pages = Array.from(document.querySelectorAll(".hwp-page"));
	        const pageMetrics = pages.map((pageEl, index) => {
          const rect = pageEl.getBoundingClientRect();
          const body = pageEl.querySelector(".hwp-page-body");
          const bodyRect = body?.getBoundingClientRect();
          const overflowingBlocks = body && bodyRect
            ? Array.from(body.children).filter((child) => {
                const childRect = child.getBoundingClientRect();
                return childRect.bottom > bodyRect.bottom + 2
                  || childRect.right > bodyRect.right + 2
                  || childRect.left < bodyRect.left - 2;
              }).length
            : 0;
          return {
            index,
            paragraphs: pageEl.querySelectorAll(".hwp-paragraph").length,
            lineSegmentParagraphs: pageEl.querySelectorAll('.hwp-paragraph[data-layout-mode="line-segments"]').length,
            lineSegments: pageEl.querySelectorAll(".hwp-line-segment").length,
            tables: pageEl.querySelectorAll(".hwp-table").length,
            images: pageEl.querySelectorAll(".hwp-image img").length,
            missingImages: pageEl.querySelectorAll(".hwp-image-missing").length,
            overflowingBlocks,
            textLength: (pageEl.innerText || "").trim().length,
            firstText: (pageEl.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 120),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
	          };
	        });
	        const preview = document.querySelector("#documentPreview");
	        const images = Array.from(document.querySelectorAll(".hwp-image img"));
	        const exportableImages = images.filter((image) => !image.closest('[data-readonly-decoration="true"]'));
	        const sourceOf = (image) => image.currentSrc || image.src || image.getAttribute("src") || "";
	        const imageInventory = {
	          total: images.length,
	          readonly: images.length - exportableImages.length,
	          exportable: exportableImages.length,
	          uniqueExportableSrc: new Set(exportableImages.map(sourceOf).filter(Boolean)).size
	        };
	        return {
          pages: pages.length,
          paragraphs: document.querySelectorAll(".hwp-paragraph").length,
          lineSegmentParagraphs: document.querySelectorAll('.hwp-paragraph[data-layout-mode="line-segments"]').length,
          lineSegments: document.querySelectorAll(".hwp-line-segment").length,
          tables: document.querySelectorAll(".hwp-table").length,
          images: document.querySelectorAll(".hwp-image img").length,
          missingImages: document.querySelectorAll(".hwp-image-missing").length,
          overflowingBlocks: pageMetrics.reduce((sum, page) => sum + page.overflowingBlocks, 0),
          editableElements: document.querySelectorAll('.hwp-paragraph[contenteditable]:not([contenteditable="false"])').length,
          activeEditableElements: Array.from(document.querySelectorAll('.hwp-paragraph[contenteditable]:not([contenteditable="false"])')).filter((element) => element.isContentEditable).length,
          parser: preview?.dataset?.parser || "",
          plainTextLength: Number(preview?.dataset?.plainText?.length || 0),
	          bodyTextLength: (preview?.innerText || "").trim().length,
	          firstText: (pages[0]?.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 180),
	          imageInventory,
	          pageMetrics
	        };
      });
      const formatValue = (await page.locator("#formatValue").innerText().catch(() => "")).trim();
      const formatKind = formatValue.startsWith("HWPX")
        ? "HWPX"
        : (formatValue.startsWith("HWP") ? "HWP" : formatValue);
      return {
        key: sample.key,
        label: sample.label,
        filename: sampleFilename(sample),
        expectedFormat: sample.expectedFormat,
        expectedPages: sample.expectedPages,
        minimumParagraphs: sample.minParagraphs,
        minimumTables: sample.minTables,
        minimumImages: sample.minImages,
        filenameValue: (await page.locator("#filenameValue").innerText().catch(() => "")).trim(),
        format: formatValue,
        formatKind,
        ...domState
      };
    };
    const waitForSample = async (sample) => {
      const started = Date.now();
      let lastState = await collectState(sample);
      while (Date.now() - started < timeoutMs) {
        lastState = await collectState(sample);
        const loadedRequestedFile = lastState.filenameValue === sampleFilename(sample);
        const loadedFormat = lastState.formatKind === sample.expectedFormat;
        const loadedCounts = lastState.paragraphs >= sample.minParagraphs
          && lastState.tables >= sample.minTables
          && lastState.images >= sample.minImages;
        if (loadedRequestedFile && loadedFormat && lastState.pages > 0 && loadedCounts) {
          return {
            ...lastState,
            elapsedMs: Date.now() - started
          };
        }
        await sleep(250);
      }
      throw new Error("로드 시간 초과: " + JSON.stringify(lastState));
    };
    for (const sample of samples) {
      try {
        await page.locator("input[type=file]").setInputFiles(sample.path);
        output.push(await waitForSample(sample));
      } catch (error) {
        output.push({
          key: sample.key,
          label: sample.label,
          filename: sampleFilename(sample),
          fatal: error instanceof Error ? error.message : String(error),
          lastState: await collectState(sample).catch((stateError) => ({
            error: stateError instanceof Error ? stateError.message : String(stateError)
          }))
        });
      }
    }
    const hwpxSample = samples.find((sample) => sample.expectedFormat === "HWPX");
    const roundTrip = hwpxSample
      ? await runRoundTripProbe(hwpxSample).catch((error) => ({
          ok: false,
          marker: roundTripMarker,
          outputPath: roundTripOutputPath,
          error: error instanceof Error ? error.message : String(error)
        }))
      : { ok: false, marker: roundTripMarker, outputPath: roundTripOutputPath, error: "HWPX 샘플이 없습니다." };
    return { results: output, roundTrip };

    async function runRoundTripProbe(sample) {
      await page.locator("input[type=file]").setInputFiles(sample.path);
      const before = await waitForSample(sample);
      const editable = page.locator('.hwp-paragraph[contenteditable]:not([contenteditable="false"])').first();
      const editableCount = await page.locator('.hwp-paragraph[contenteditable]:not([contenteditable="false"])').count();
      if (editableCount < 1) throw new Error("편집 가능한 문단을 찾지 못했습니다.");

      const originalText = (await editable.innerText()).trim();
      const editedText = originalText
        ? originalText + " " + roundTripMarker
        : roundTripMarker;
      await editable.fill(editedText);
      await sleep(100);

      const markerBeforeExport = await page.evaluate((marker) => {
        return (document.querySelector("#documentPreview")?.textContent || "").includes(marker);
      }, roundTripMarker);
      if (!markerBeforeExport) throw new Error("편집 문구가 DOM에 반영되지 않았습니다.");

      await page.locator("#exportFormatSelect").selectOption("hwpx");
      const downloadPromise = page.waitForEvent("download", { timeout: timeoutMs });
      await page.locator("#exportButton").click();
      const download = await downloadPromise;
      await download.saveAs(roundTripOutputPath);
      const failure = await download.failure();
      if (failure) throw new Error("다운로드 실패: " + failure);

      const exportedSample = {
        ...sample,
        path: roundTripOutputPath,
        expectedPages: 0,
        minParagraphs: 1,
        minTables: 0,
        minImages: 0
      };
      await page.locator("input[type=file]").setInputFiles(roundTripOutputPath);
      const reopened = await waitForSample(exportedSample);
      const markerAfterReopen = await page.evaluate((marker) => {
        return (document.querySelector("#documentPreview")?.textContent || "").includes(marker);
      }, roundTripMarker);

      return {
        ok: markerAfterReopen && reopened.formatKind === "HWPX" && reopened.pages === before.pages,
        marker: roundTripMarker,
        outputPath: roundTripOutputPath,
	        source: {
	          key: sample.key,
	          filename: sampleFilename(sample),
	          pages: before.pages,
	          images: before.images,
	          imageInventory: before.imageInventory,
	          editableElements: before.editableElements,
	          activeEditableElements: before.activeEditableElements,
	          originalTextLength: originalText.length
        },
        download: {
          suggestedFilename: download.suggestedFilename()
        },
        reopened: {
          filenameValue: reopened.filenameValue,
          format: reopened.format,
          formatKind: reopened.formatKind,
          pages: reopened.pages,
          expectedPages: before.pages,
	          paragraphs: reopened.paragraphs,
	          tables: reopened.tables,
	          images: reopened.images,
	          imageInventory: reopened.imageInventory,
	          markerFound: markerAfterReopen,
	          bodyTextLength: reopened.bodyTextLength
        }
      };
    }
  }`;
  const output = runPw([`-s=${session}`, 'run-code', code]);
  return extractJsonResult(output);
}

function evaluateProbeResult(result, roundTrip) {
  const failures = [];
  const warnings = [];
  const checked = [];
  for (const sample of samples) {
    const actual = result.find((entry) => entry.key === sample.key);
    if (!actual) {
      failures.push(`검증 결과 누락: ${sample.key}`);
      continue;
    }
    const issues = [];
    const advisories = [];
    if (actual.fatal) {
      issues.push(`로드 실패: ${actual.fatal}`);
    }
    if (actual.formatKind !== sample.expectedFormat) {
      issues.push(`형식 불일치 ${actual.format || actual.formatKind} !== ${sample.expectedFormat}`);
    }
    if (actual.paragraphs < sample.minParagraphs) {
      issues.push(`문단 수 부족 ${actual.paragraphs} < ${sample.minParagraphs}`);
    }
    if (actual.tables < sample.minTables) {
      issues.push(`표 수 부족 ${actual.tables} < ${sample.minTables}`);
    }
    if (actual.images < sample.minImages) {
      issues.push(`이미지 수 부족 ${actual.images} < ${sample.minImages}`);
    }
    if (actual.missingImages > 0) {
      issues.push(`이미지 렌더링 실패 ${actual.missingImages}개`);
    }
    const referenceImages = Number(sample.referenceCounts?.officialViewerImages ?? 0);
    if (referenceImages > 0 && actual.images < referenceImages) {
      issues.push(`공식 뷰어 기준 이미지 수 부족 ${actual.images} < ${referenceImages}`);
    }
    if (sample.expectedFormat === 'HWPX' && actual.lineSegmentParagraphs < Math.max(1, Math.floor(actual.paragraphs * 0.08))) {
      issues.push(`HWPX 줄 배치 적용 부족 ${actual.lineSegmentParagraphs} / ${actual.paragraphs}`);
    }
    if (actual.overflowingBlocks > Math.max(5, actual.pages * 2)) {
      advisories.push(`페이지 본문 밖으로 넘친 블록 ${actual.overflowingBlocks}개`);
    }
    if (actual.pages !== sample.expectedPages) {
      actual.pageMismatch = {
        actual: actual.pages,
        expected: sample.expectedPages
      };
      if (strictPageExpectations) {
        issues.push(`페이지 수 불일치 ${actual.pages} !== ${sample.expectedPages}`);
      } else {
        advisories.push(`페이지 수 불일치 ${actual.pages} !== ${sample.expectedPages}`);
      }
    }
    const row = {
      ...actual,
      expectations: {
        format: sample.expectedFormat,
        pages: sample.expectedPages,
        minimumParagraphs: sample.minParagraphs,
        minimumTables: sample.minTables,
        minimumImages: sample.minImages,
        referenceCounts: sample.referenceCounts
      },
      diffs: {
        pages: Number(actual.pages) - Number(sample.expectedPages),
        paragraphsVsMinimum: Number(actual.paragraphs) - Number(sample.minParagraphs),
        tablesVsMinimum: Number(actual.tables) - Number(sample.minTables),
        imagesVsMinimum: Number(actual.images) - Number(sample.minImages)
      },
      issues,
      advisories,
      ok: issues.length === 0
    };
    checked.push(row);
    for (const issue of issues) failures.push(`${sample.label}: ${issue}`);
    for (const advisory of advisories) warnings.push(`${sample.label}: ${advisory}`);
  }
  if (!roundTrip?.ok) {
    failures.push(`HWPX 편집-내보내기-재열기 실패: ${roundTrip?.error || '수정 문구가 재열기 후 보존되지 않았습니다.'}`);
  }
  if (roundTrip?.source?.imageInventory && roundTrip?.reopened) {
    const source = roundTrip.source.imageInventory;
    const reopenedImages = Number(roundTrip.reopened.images || 0);
    if (reopenedImages < source.exportable) {
      failures.push(`HWPX roundtrip 이미지 손실: exportable ${source.exportable}개 중 재열기 ${reopenedImages}개`);
    }
    if (source.total > source.exportable && reopenedImages === source.exportable) {
      warnings.push(`HWPX roundtrip 이미지 수 감소는 readonly/장식 이미지 제외로 보입니다: total ${source.total}, exportable ${source.exportable}, reopened ${reopenedImages}`);
    }
  }
  if (roundTrip?.hwpxImages) {
    const zipImages = roundTrip.hwpxImages;
    const reopenedExportableImages = Number(
      roundTrip.reopened?.imageInventory?.exportable ?? roundTrip.reopened?.images ?? 0
    );
    if (zipImages.picCount !== reopenedExportableImages) {
      failures.push(`HWPX roundtrip ZIP/DOM 이미지 수 불일치: hp:pic ${zipImages.picCount}, exportable DOM ${reopenedExportableImages}`);
    }
    if (zipImages.binItems < zipImages.uniqueBinaryRefs) {
      failures.push(`HWPX roundtrip binary 참조 누락: binItems ${zipImages.binItems}, unique refs ${zipImages.uniqueBinaryRefs}`);
    }
    if (zipImages.missingContentHpfFiles?.length) {
      failures.push(`HWPX roundtrip content.hpf stale 참조: ${zipImages.missingContentHpfFiles.join(', ')}`);
    }
  }
  return { results: checked, failures, warnings };
}

function inspectHwpxImages(filePath) {
  try {
    const zip = unzipSync(new Uint8Array(readFileSync(filePath)));
    const text = (name) => zip[name] ? strFromU8(zip[name]) : '';
    const header = text('Contents/header.xml');
    const section = text('Contents/section0.xml');
    const contentHpf = text('Contents/content.hpf');
    const binaryRefs = [...section.matchAll(/binaryItemIDRef="([^"]+)"/g)].map((match) => match[1]);
    const contentHpfFiles = [...contentHpf.matchAll(/\bhref="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((href) => href && !/^(https?:|data:)/i.test(href));
    const missingContentHpfFiles = contentHpfFiles.filter((href) => !zip[normalizeHwpxHref(href)]);
    return {
      binItems: [...header.matchAll(/<hh:binItem\b/g)].length,
      picCount: [...section.matchAll(/<hp:pic\b/g)].length,
      binaryRefCount: binaryRefs.length,
      uniqueBinaryRefs: new Set(binaryRefs).size,
      contentHpfFiles: contentHpfFiles.length,
      missingContentHpfFiles
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      binItems: 0,
      picCount: 0,
      binaryRefCount: 0,
      uniqueBinaryRefs: 0,
      contentHpfFiles: 0,
      missingContentHpfFiles: []
    };
  }
}

function normalizeHwpxHref(href) {
  return href.replace(/^\/+/, '').replace(/\\/g, '/');
}

function runPw(args) {
  try {
    return execFileSync(pwcli, args, {
      cwd: rootDir,
      encoding: 'utf8',
      timeout: commandTimeoutMs,
      env: {
        ...process.env,
        CODEX_HOME: process.env.CODEX_HOME || join(process.env.HOME || '', '.codex')
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    const stdout = error?.stdout?.toString?.() || '';
    const stderr = error?.stderr?.toString?.() || '';
    throw new Error(`Playwright 명령 실패: ${args.join(' ')}\n${stdout}\n${stderr}`.trim());
  }
}

function startStaticServer(port) {
  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: distDir,
    stdio: 'ignore'
  });
  child.on('error', (error) => {
    throw error;
  });
  return child;
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function waitForHttpServer(url) {
  const started = Date.now();
  while (Date.now() - started < 8000) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return;
    } catch {
      // retry until timeout
    }
    await sleep(200);
  }
  throw new Error(`검증 서버에 연결하지 못했습니다: ${url}`);
}

function findFreePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createNetServer();
    server.once('error', rejectPort);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === 'string') {
          rejectPort(new Error('사용 가능한 포트를 찾지 못했습니다.'));
          return;
        }
        resolvePort(address.port);
      });
    });
  });
}

function extractJsonResult(output) {
  const match = output.match(/### Result\n([\s\S]*?)\n### Ran Playwright code/);
  if (!match) throw new Error(`Playwright 결과 JSON을 찾지 못했습니다.\n${output}`);
  return JSON.parse(match[1]);
}

function writeReports(payload) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`);
  mkdirSync(dirname(markdownReportPath), { recursive: true });
  writeFileSync(markdownReportPath, buildMarkdownReport(payload));
}

function buildMarkdownReport(payload) {
  const lines = [
    '# Extension Editor Verification',
    '',
    `Generated: ${payload.generatedAt}`,
    `URL: ${payload.url}`,
    `STRICT_PAGE_EXPECTATIONS: ${payload.strictPageExpectations ? '1' : '0'}`,
    `Baseline: ${payload.baselinePath}`,
    '',
    '| sample | format | pages | paragraphs | tables | images | status |',
    '| --- | --- | ---: | ---: | ---: | ---: | --- |'
  ];
  for (const result of payload.results) {
    const status = result.ok ? (result.advisories?.length ? 'warning' : 'ok') : 'fail';
    lines.push([
      result.label,
      `${result.format || '-'} / ${result.expectations?.format || '-'}`,
      `${result.pages ?? '-'} / ${result.expectations?.pages ?? '-'}`,
      `${result.paragraphs ?? '-'} / >=${result.expectations?.minimumParagraphs ?? '-'}`,
      `${result.tables ?? '-'} / >=${result.expectations?.minimumTables ?? '-'}`,
      `${result.images ?? '-'} / >=${result.expectations?.minimumImages ?? '-'}`,
      status
    ].map((cell) => ` ${String(cell).replace(/\|/g, '\\|')} `).join('|').replace(/^/, '|').replace(/$/, '|'));
  }

  if (payload.roundTrip) {
    lines.push(
      '',
      '## Round Trip',
      '',
      `Status: ${payload.roundTrip.ok ? 'ok' : 'fail'}`,
      `Output: ${payload.roundTrip.outputPath || '-'}`,
      `Marker: ${payload.roundTrip.marker || '-'}`
    );
    if (payload.roundTrip.reopened) {
      lines.push(
        `Reopened: ${payload.roundTrip.reopened.filenameValue || '-'} / ${payload.roundTrip.reopened.format || '-'} / ${payload.roundTrip.reopened.pages ?? '-'} / ${payload.roundTrip.reopened.expectedPages ?? '-'} pages`,
        `Marker found: ${payload.roundTrip.reopened.markerFound ? 'yes' : 'no'}`
      );
    }
    if (payload.roundTrip.error) lines.push(`Error: ${payload.roundTrip.error}`);
  }

  if (payload.failures.length) {
    lines.push('', '## Failures', '');
    for (const failure of payload.failures) lines.push(`- ${failure}`);
  }
  if (payload.warnings.length) {
    lines.push('', '## Warnings', '');
    for (const warning of payload.warnings) lines.push(`- ${warning}`);
  }

  lines.push('');
  return `${lines.join('\n')}`;
}
