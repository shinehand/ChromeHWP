/**
 * parser.worker.js — HWP 파싱 Web Worker
 *
 * 파싱 로직을 메인 스레드와 분리해 UI 블로킹을 원천 차단합니다.
 * main thread ↔ Worker 통신: postMessage / onmessage
 */

/* ── HWP 파서 (worker 내 독립 구현) ── */

const HWP_SIG = [0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1];

function u16(b, o) { return (b[o] ?? 0) | ((b[o+1] ?? 0) << 8); }
function u32(b, o) {
  return ((b[o]??0)|((b[o+1]??0)<<8)|((b[o+2]??0)<<16)|((b[o+3]??0)<<24)) >>> 0;
}

function run(text) {
  return { text: text||'', bold:false, italic:false, underline:false,
           fontSize:11, fontName:'Malgun Gothic', color:'#000000' };
}

function paginate(paras, n) {
  if (!paras.length) return [{ index:0, paragraphs:[] }];
  const r = [];
  for (let i=0; i<paras.length; i+=n)
    r.push({ index: r.length, paragraphs: paras.slice(i, i+n) });
  return r;
}

/* ────────────────────────────────────────────────
   전략 1: CFB PrvText 스트림 추출
──────────────────────────────────────────────── */
function scanPrvText(b) {
  const exp  = u16(b, 0x1E);
  const ss   = (exp >= 7 && exp <= 14) ? (1 << exp) : 512;
  const miniCutoff = u32(b, 0x38) || 4096;

  const dirStartSec = u32(b, 0x2C);
  if (dirStartSec >= 0xFFFFFFFA) return null;
  const dirBase = (dirStartSec + 1) * ss;
  if (dirBase + 128 > b.length) return null;

  // Root Entry의 미니 스트림 컨테이너 위치
  const rootStartSec = u32(b, dirBase + 116);
  const miniContainerOff = (rootStartSec < 0xFFFFFFFA) ? (rootStartSec + 1) * ss : -1;

  self.postMessage({ type:'progress', msg:`CFB 스캔 중... ss=${ss} miniCutoff=${miniCutoff}` });

  const PAT = [0x50,0x00,0x72,0x00,0x76,0x00,0x54,0x00,0x65,0x00,0x78,0x00,0x74,0x00];

  for (let pos = 512; pos + 128 <= b.length; pos += 128) {
    if (u16(b, pos + 64) !== 16) continue;
    let ok = true;
    for (let k = 0; k < PAT.length; k++) {
      if (b[pos + k] !== PAT[k]) { ok = false; break; }
    }
    if (!ok) continue;

    const startSec = u32(b, pos + 116);
    const streamSz = u32(b, pos + 120);
    if (startSec >= 0xFFFFFFFA || streamSz === 0 || streamSz > 8*1024*1024) return null;

    let off;
    if (streamSz < miniCutoff && miniContainerOff > 0) {
      off = miniContainerOff + startSec * 64;
    } else {
      off = (startSec + 1) * ss;
    }

    if (off < 512 || off >= b.length) return null;

    const end  = Math.min(off + streamSz, b.length);
    const text = new TextDecoder('utf-16le').decode(b.slice(off, end));

    let korean = 0, printable = 0;
    for (const c of text) {
      const cp = c.charCodeAt(0);
      if (cp >= 0xAC00 && cp <= 0xD7A3) { korean++; printable++; }
      else if (cp >= 0x20 || cp === 10 || cp === 13) printable++;
    }
    if (text.length === 0 || printable / text.length < 0.6 || korean < 3) return null;

    self.postMessage({ type:'progress', msg:`PrvText 추출 성공 (${text.length}글자)` });
    return text;
  }
  return null;
}

/* ────────────────────────────────────────────────
   전략 2: 한글 UTF-16LE 블록 직접 스캔
──────────────────────────────────────────────── */
function scanKoreanText(b) {
  self.postMessage({ type:'progress', msg:'한글 텍스트 직접 스캔 중...' });

  const isValid = cp =>
    (cp >= 0x20  && cp <= 0x7E)    ||
    (cp >= 0xAC00 && cp <= 0xD7A3) ||
    (cp >= 0x1100 && cp <= 0x11FF) ||
    (cp >= 0x3130 && cp <= 0x318F) ||
    cp === 10 || cp === 13 || cp === 9 || cp === 2;

  let bestStart = -1, bestScore = 0, bestRawLen = 0;
  let runStart  = -1, runLen = 0, koreanInRun = 0;

  const flush = () => {
    if (runLen >= 100 && koreanInRun >= runLen / 10) {
      const score = runLen * (koreanInRun / (runLen / 2));
      if (score > bestScore) {
        bestStart = runStart; bestScore = score; bestRawLen = runLen;
      }
    }
    runStart = -1; runLen = 0; koreanInRun = 0;
  };

  for (let i = 512; i + 2 <= b.length; i += 2) {
    const cp = b[i] | (b[i+1] << 8);
    if (isValid(cp)) {
      if (runStart < 0) runStart = i;
      runLen += 2;
      if (cp >= 0xAC00 && cp <= 0xD7A3) koreanInRun++;
    } else { flush(); }
  }
  flush();

  if (bestStart < 0) return null;
  const text = new TextDecoder('utf-16le').decode(b.slice(bestStart, bestStart + bestRawLen));
  self.postMessage({ type:'progress', msg:`한글 스캔 성공 (${text.length}글자)` });
  return text;
}

/* ────────────────────────────────────────────────
   HWPX (ZIP + XML) 파싱
──────────────────────────────────────────────── */
async function parseHwpx(buffer) {
  // Worker 내부에서는 JSZip을 importScripts로 로드
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip을 Worker에서 사용할 수 없습니다. 메인 스레드에서 파싱합니다.');
  }
  const zip   = await JSZip.loadAsync(buffer);
  const keys  = Object.keys(zip.files)
    .filter(p => /Contents[\\/]section\d+\.xml$/i.test(p)).sort();
  if (!keys.length) throw new Error('HWPX: 섹션 없음');

  const pages = [];
  for (let i = 0; i < keys.length; i++) {
    const xml  = await zip.files[keys[i]].async('string');
    const doc  = new DOMParser().parseFromString(xml, 'application/xml');
    const ps   = Array.from(doc.querySelectorAll('p'));
    const paras = ps.length
      ? ps.map(p => ({ align: p.getAttribute('align')||'left', texts:[run(p.textContent||'')] }))
      : [{ align:'left', texts:[run(doc.documentElement.textContent.trim())] }];
    pages.push({ index: i, paragraphs: paras });
  }
  return { meta:{ pages:pages.length }, pages };
}

/* ────────────────────────────────────────────────
   메시지 수신 → 파싱 실행
──────────────────────────────────────────────── */
self.onmessage = async ({ data }) => {
  const { buffer, filename } = data;
  const ext = filename.split('.').pop().toLowerCase();

  try {
    let doc;

    if (ext === 'hwpx') {
      try {
        // Worker 내 JSZip 시도 (importScripts 필요)
        importScripts('../lib/jszip.min.js');
        doc = await parseHwpx(buffer);
      } catch(e) {
        // Worker에서 JSZip 로드 실패 → 메인 스레드에 위임 요청
        self.postMessage({ type:'fallback_main', reason: e.message });
        return;
      }
    } else {
      // HWP 5.0
      const b = new Uint8Array(buffer);
      if (!HWP_SIG.every((v,i) => b[i] === v)) {
        throw new Error('HWP 시그니처 불일치');
      }

      let text = null;
      try { text = scanPrvText(b); }     catch(e) { console.warn(e); }
      if (!text) {
        try { text = scanKoreanText(b); } catch(e) { console.warn(e); }
      }

      if (!text) {
        doc = {
          meta: { pages:1, note:'파싱 실패' },
          pages:[{ index:0, paragraphs:[{ align:'center', texts:[run(
            '⚠️ 이 HWP 파일의 텍스트를 추출하지 못했습니다.\n\n' +
            '해결책: 한글에서 "다른 이름으로 저장 → HWPX" 후 재시도하세요.'
          )] }] }]
        };
      } else {
        const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\x02/g,'\n').split('\n');
        const paras = lines.map(l => ({ align:'left', texts:[run(l)] }));
        const pages = paginate(paras, 35);
        doc = { meta:{ pages:pages.length, note:'⚠️ PrvText 텍스트 추출 (서식 미지원)' }, pages };
      }
    }

    self.postMessage({ type:'done', doc });

  } catch(err) {
    self.postMessage({ type:'error', message: err.message });
  }
};
