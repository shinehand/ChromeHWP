#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = join(rootDir, 'dist');
const editorPath = join(distDir, 'src/editor/editor.html');
const pwcli = process.env.PWCLI
  || join(process.env.CODEX_HOME || join(process.env.HOME || '', '.codex'), 'skills/playwright/scripts/playwright_cli.sh');
const session = process.env.PLAYWRIGHT_CLI_SESSION || `visual-${Date.now().toString(36)}`;
const outputDir = resolve(process.env.VISUAL_FIDELITY_DIR || join(rootDir, 'output/hancom-oracle/extension-visual-current'));
const manifestPath = join(outputDir, 'hancom-page-audit-manifest.json');
const reportPath = join(outputDir, 'hancom-page-audit-report.json');
const builderPath = join(rootDir, 'scripts/build_hancom_page_audit.py');
const browserTimeoutMs = Number(process.env.VISUAL_FIDELITY_BROWSER_TIMEOUT_MS || 45000);
const commandTimeoutMs = Number(process.env.VISUAL_FIDELITY_COMMAND_TIMEOUT_MS || 180000);
const strict = process.env.STRICT_VISUAL_FIDELITY === '1';
const samples = buildSamples();

for (const filePath of [editorPath, pwcli, builderPath, ...samples.map((sample) => sample.path)]) {
  if (!existsSync(filePath)) throw new Error(`필수 파일을 찾지 못했습니다: ${filePath}`);
}

void run();

async function run() {
  const port = await findFreePort();
  const staticServer = startStaticServer(port);
  const url = `http://127.0.0.1:${port}/src/editor/editor.html`;
  try {
    await waitForHttpServer(url);
    mkdirSync(outputDir, { recursive: true });
    runPw([`-s=${session}`, 'open', url]);
    const captureResult = captureCurrentEditorPages(url);
    persistPageDomDiagnostics(captureResult);
    const manifest = {
      generatedAt: new Date().toISOString(),
      auditId: session,
      source: 'ChromeHWP extension editor DOM screenshots compared against stored Hancom Viewer page screenshots',
      outputDirectory: outputDir,
      documents: captureResult.documents
    };
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    execFileSync('python3', [
      builderPath,
      '--manifest', manifestPath,
      '--output-dir', outputDir,
      '--target-width', '900',
      '--metric-width', 'native',
    ], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: commandTimeoutMs
    });

    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    const summary = summarizeReport(report);
    const payload = {
      ok: !strict || summary.strictFailures.length === 0,
      generatedAt: new Date().toISOString(),
      strict,
      url,
      session,
      outputDir,
      manifestPath,
      reportPath,
      capture: captureResult,
      summary
    };
    const summaryPath = join(outputDir, 'visual-fidelity-summary.json');
    writeFileSync(summaryPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(JSON.stringify(payload, null, 2));
    if (!payload.ok) {
      throw new Error(`시각 회귀 검증 실패 ${summary.strictFailures.length}건\n${summary.strictFailures.join('\n')}`);
    }
  } finally {
    try {
      runPw([`-s=${session}`, 'close']);
    } catch {
      // Best effort cleanup.
    }
    if (!staticServer.killed) staticServer.kill();
  }
}

function buildSamples() {
  return [
    {
      key: 'goyeopje',
      filename: 'goyeopje.hwp',
      path: join(rootDir, 'output/playwright/inputs/goyeopje.hwp'),
      expectedFormat: 'HWP',
      expectedPages: 2,
      referenceDir: join(rootDir, 'output/hancom-oracle/page-audit/goyeopje')
    },
    {
      key: 'goyeopje-full-2024',
      filename: 'goyeopje-full-2024.hwp',
      path: join(rootDir, 'output/playwright/inputs/goyeopje-full-2024.hwp'),
      expectedFormat: 'HWP',
      expectedPages: 11,
      referenceDir: join(rootDir, 'output/hancom-oracle/page-audit/goyeopje-full-2024')
    },
    {
      key: 'gyeolseokgye',
      filename: 'gyeolseokgye.hwp',
      path: join(rootDir, 'output/playwright/inputs/gyeolseokgye.hwp'),
      expectedFormat: 'HWP',
      expectedPages: 1,
      referenceDir: join(rootDir, 'output/hancom-oracle/page-audit/gyeolseokgye')
    },
    {
      key: 'attachment-sale-notice',
      filename: 'attachment-sale-notice.hwp',
      path: join(rootDir, 'output/playwright/inputs/attachment-sale-notice.hwp'),
      expectedFormat: 'HWP',
      expectedPages: 4,
      referenceDir: join(rootDir, 'output/hancom-oracle/page-audit/attachment-sale-notice')
    },
    {
      key: 'incheon-2a',
      filename: 'incheon-2a.hwpx',
      path: join(rootDir, 'output/playwright/inputs/incheon-2a.hwpx'),
      expectedFormat: 'HWPX',
      expectedPages: 18,
      referenceDir: preferredReferenceDir('incheon-2a', [
        join(rootDir, 'output/hancom-oracle/page-audit-incheon-latest/incheon-2a'),
        join(rootDir, 'output/hancom-oracle/page-audit/incheon-2a')
      ])
    }
  ].filter((sample) => existsSync(sample.referenceDir));
}

function preferredReferenceDir(_key, candidates) {
  return candidates.find((candidate) => existsSync(candidate)) || candidates[candidates.length - 1];
}

function captureCurrentEditorPages(url) {
  const pageOutputs = new Map();
  for (const sample of samples) {
    const pages = [];
    const docDir = join(outputDir, sample.key);
    mkdirSync(docDir, { recursive: true });
    for (let pageIndex = 0; pageIndex < sample.expectedPages; pageIndex += 1) {
      const referencePath = join(sample.referenceDir, `hancom-page-${String(pageIndex + 1).padStart(3, '0')}.png`);
      if (!existsSync(referencePath)) continue;
      pages.push({
        pageIndex,
        hancomScreenshot: referencePath,
        chromePage: join(docDir, `chrome-page-${String(pageIndex + 1).padStart(3, '0')}.png`),
        targetBand: pageIndex === sample.expectedPages - 1 ? 'last' : 'first'
      });
    }
    pageOutputs.set(sample.key, pages);
  }

  const code = `async (page) => {
    await page.goto(${JSON.stringify(url)}, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.setViewportSize({ width: 1800, height: 2200 });
    const samples = ${JSON.stringify(samples)};
    const pageOutputs = ${JSON.stringify(Object.fromEntries(pageOutputs))};
    const timeoutMs = ${JSON.stringify(browserTimeoutMs)};
    const sleep = (ms) => page.waitForTimeout(ms);
    const normalizeName = (value) => String(value || "").trim().normalize("NFC");
    const sampleFilename = (sample) => normalizeName(sample.filename || sample.path.split(/[\\\\/]/).pop());
    const collectState = async () => page.evaluate(() => {
      const pages = Array.from(document.querySelectorAll(".hwp-page"));
      const preview = document.querySelector("#documentPreview");
      return {
        filename: (document.querySelector("#filenameValue")?.textContent || "").trim(),
        renderedFilename: preview?.dataset?.filename || "",
        format: (document.querySelector("#formatValue")?.textContent || "").trim(),
        pages: pages.length,
        oraclePages: document.querySelectorAll(".hwp-page-oracle").length,
        canvasPages: document.querySelectorAll(".hwp-page-canvas canvas").length,
        paragraphs: document.querySelectorAll(".hwp-paragraph").length,
        lineSegmentParagraphs: document.querySelectorAll('.hwp-paragraph[data-layout-mode="line-segments"]').length,
        lineSegments: document.querySelectorAll(".hwp-line-segment").length
      };
    });
    const collectPageDom = async (pageIndex) => page.locator(".hwp-page").nth(pageIndex).evaluate((pageElement) => {
      const rectObject = (rect) => ({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      });
      const pageRect = pageElement.getBoundingClientRect();
      const relativeRect = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top - pageRect.top,
          left: rect.left - pageRect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom - pageRect.top,
          right: rect.right - pageRect.left
        };
      };
      const cleanText = (value) => String(value || "").replace(/\\s+/g, " ").trim();
      const datasetObject = (element) => Object.fromEntries(Object.entries(element.dataset || {}));
      const tables = Array.from(pageElement.querySelectorAll(".hwp-table")).map((table, index) => {
        const rows = Array.from(table.querySelectorAll(":scope > tbody > tr")).map((row, rowIndex) => ({
          rowIndex,
          dataset: datasetObject(row),
          rect: relativeRect(row),
          cellCount: row.querySelectorAll(":scope > .hwp-table-cell, :scope > td").length,
          text: cleanText(row.innerText).slice(0, 160)
        }));
        const wrapper = table.closest(".hwp-table-wrap");
        return {
          index,
          depth: Number(table.dataset.nestingLevel || wrapper?.dataset?.nestingLevel || 0),
          wrapDataset: wrapper ? datasetObject(wrapper) : {},
          tableDataset: datasetObject(table),
          rect: wrapper ? relativeRect(wrapper) : relativeRect(table),
          tableRect: relativeRect(table),
          rowCount: rows.length,
          firstRows: rows.slice(0, 12),
          lastRows: rows.slice(-8),
          rows,
          text: cleanText(table.innerText).slice(0, 240),
          style: {
            height: table.style.height || "",
            minHeight: table.style.minHeight || "",
            width: table.style.width || ""
          },
          tableStyle: {
            border: table.style.border || "",
            background: table.style.background || ""
          }
        };
      });
      const paragraphs = Array.from(pageElement.querySelectorAll(".hwp-paragraph")).map((paragraph, index) => ({
        index,
        dataset: datasetObject(paragraph),
        rect: relativeRect(paragraph),
        text: cleanText(paragraph.innerText).slice(0, 120),
        style: {
          top: paragraph.style.top || "",
          left: paragraph.style.left || "",
          height: paragraph.style.height || "",
          minHeight: paragraph.style.minHeight || "",
          lineHeight: paragraph.style.lineHeight || "",
          fontSize: paragraph.style.fontSize || ""
        }
      }));
      return {
        page: { width: pageRect.width, height: pageRect.height },
        bodyRect: rectObject(pageRect),
        text: cleanText(pageElement.innerText).slice(0, 1000),
        tables,
        paragraphs: paragraphs.slice(0, 200),
        paragraphCount: paragraphs.length
      };
    });
    const waitForSample = async (sample) => {
      const started = Date.now();
      let state = await collectState();
      const expectedFilename = sampleFilename(sample);
      while (Date.now() - started < timeoutMs) {
        state = await collectState();
        const formatKind = state.format.startsWith("HWPX") ? "HWPX" : (state.format.startsWith("HWP") ? "HWP" : state.format);
        if (
          normalizeName(state.filename) === expectedFilename
          && normalizeName(state.renderedFilename) === expectedFilename
          && formatKind === sample.expectedFormat
          && state.pages === sample.expectedPages
          && state.oraclePages === 0
          && state.canvasPages === 0
        ) {
          return state;
        }
        await sleep(250);
      }
      throw new Error("로드 시간 초과: " + JSON.stringify({
        expectedFilename,
        expectedFormat: sample.expectedFormat,
        expectedPages: sample.expectedPages,
        state
      }));
    };
    const documents = [];
    for (const sample of samples) {
      await page.locator("input[type=file]").setInputFiles(sample.path);
      const state = await waitForSample(sample);
      const pages = pageOutputs[sample.key] || [];
      for (const pageItem of pages) {
        await page.locator(".hwp-page").nth(pageItem.pageIndex).screenshot({
          path: pageItem.chromePage,
          animations: "disabled",
          timeout: timeoutMs
        });
        pageItem.domDiagnostics = await collectPageDom(pageItem.pageIndex);
      }
      documents.push({
        id: sample.key,
        filename: sample.filename,
        sourcePath: sample.path,
        pageCount: sample.expectedPages,
        state,
        pages
      });
    }
    return { documents };
  }`;
  return extractJsonResult(runPw([`-s=${session}`, 'run-code', code]));
}

function persistPageDomDiagnostics(captureResult) {
  const domOutputDir = join(rootDir, 'output/playwright');
  mkdirSync(domOutputDir, { recursive: true });
  for (const document of captureResult.documents || []) {
    for (const page of document.pages || []) {
      const diagnostics = page.domDiagnostics;
      if (!diagnostics) continue;
      const domPath = join(domOutputDir, `${document.id}-p${String(page.pageIndex + 1).padStart(2, '0')}-dom-current.json`);
      writeFileSync(domPath, `${JSON.stringify({
        filename: document.filename,
        pages: document.pageCount,
        page: {
          index: page.pageIndex + 1,
          width: diagnostics.page?.width ?? null,
          height: diagnostics.page?.height ?? null
        },
        bodyRect: diagnostics.bodyRect,
        text: diagnostics.text,
        tables: diagnostics.tables,
        paragraphs: diagnostics.paragraphs,
        paragraphCount: diagnostics.paragraphCount
      }, null, 2)}\n`);
      page.domDiagnostics = {
        path: domPath,
        tableCount: diagnostics.tables?.length ?? 0,
        paragraphCount: diagnostics.paragraphs?.length ?? 0
      };
    }
  }
}

function summarizeReport(report) {
  const strictFailures = [];
  const documents = [];
  for (const doc of report.results || []) {
    const pages = doc.pages || [];
    const diffs = pages
      .map((page) => Number(page.diff))
      .filter((value) => Number.isFinite(value));
    const worstPages = [...pages]
      .sort((left, right) => Number(right.diff || 0) - Number(left.diff || 0))
      .slice(0, 5)
      .map((page) => ({
        page: Number(page.pageIndex) + 1,
        verdict: page.verdict,
        diff: page.diff,
        blurDiff: page.visualMetrics?.blurDiff,
        layoutDiff: page.visualMetrics?.projectionDiff?.combined,
        compare: page.pageCompare
      }));
    const badPages = pages.filter((page) => ['mismatch', 'capture-error', 'capture-review'].includes(page.verdict));
    for (const page of badPages) {
      strictFailures.push(`${doc.filename} ${Number(page.pageIndex) + 1}쪽 ${page.verdict} diff=${page.diff ?? 'n/a'}`);
    }
    documents.push({
      id: doc.id,
      filename: doc.filename,
      pageCount: doc.pageCount,
      verdictCounts: doc.verdictCounts,
      averageDiff: diffs.length ? diffs.reduce((sum, value) => sum + value, 0) / diffs.length : null,
      maxDiff: diffs.length ? Math.max(...diffs) : null,
      worstPages
    });
  }
  return {
    documentCount: documents.length,
    totalPages: documents.reduce((sum, doc) => sum + doc.pageCount, 0),
    documents,
    strictFailures
  };
}

function runPw(args) {
  try {
    return execFileSync(pwcli, args, {
      cwd: rootDir,
      encoding: 'utf8',
      timeout: commandTimeoutMs,
      maxBuffer: 128 * 1024 * 1024,
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
