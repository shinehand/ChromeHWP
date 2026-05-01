import type {
  EditableBlock,
  EditableExportDocument,
  EditableParagraphBlock,
  EditableTableBlock,
  EditableTableCell
} from './editable-document';

export function exportEditableDocumentToPlainText(document: EditableExportDocument): string {
  return document.pages
    .map((page) => page.blocks.map(blockToPlainText).join('\n'))
    .join('\n\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trimEnd();
}

function blockToPlainText(block: EditableBlock): string {
  if (block.type === 'paragraph') return paragraphToPlainText(block);
  if (block.type === 'table') return tableToPlainText(block);
  return block.altText ? `[이미지: ${block.altText}]` : '[이미지]';
}

function paragraphToPlainText(block: EditableParagraphBlock): string {
  return block.runs.map((run) => run.text).join('');
}

function tableToPlainText(block: EditableTableBlock): string {
  return block.rows
    .map((row) => row.cells.map(cellToPlainText).join('\t'))
    .join('\n');
}

function cellToPlainText(cell: EditableTableCell): string {
  return cell.blocks
    .map(blockToPlainText)
    .join('\n')
    .replace(/\n+/g, ' ')
    .trim();
}
