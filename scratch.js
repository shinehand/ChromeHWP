import fs from 'fs';
import { resolve } from 'path';
import { HwpParser } from './js/hwp-parser.js';

const buffer = fs.readFileSync(resolve('downloads/attachment-sale-notice.hwp'));
const doc = HwpParser.parse(buffer);
const layoutTree = HwpParser.buildLayoutTree(doc);

const images = [];
function findImages(blocks) {
  for (const b of blocks) {
    if (b.type === 'image') images.push(b);
    if (b.paragraphs) findImages(b.paragraphs);
    if (b.cells) b.cells.forEach(c => findImages(c.paragraphs || []));
    if (b.rows) b.rows.forEach(r => r.cells.forEach(c => findImages(c.paragraphs || [])));
  }
}

layoutTree.pages.forEach(p => findImages(p.blocks));
images.forEach(img => {
  console.log('Image:', {
    inline: img.inline,
    horzRelTo: img.horzRelTo,
    horzAlign: img.horzAlign,
    horzOffset: img.horzOffset,
    vertRelTo: img.vertRelTo,
    vertAlign: img.vertAlign,
    vertOffset: img.vertOffset,
    width: img.width,
    height: img.height,
  });
});
