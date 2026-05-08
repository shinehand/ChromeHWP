import type {
  DocumentAsset,
  DocumentBlock,
  DocumentSourceFormat,
  SourceReference,
  TableCell,
  TableRow,
  TextRun
} from './document-model';

interface SourceReferenceContext {
  readonly format: DocumentSourceFormat;
  readonly path: string;
  readonly sectionIndex: number;
  readonly prefix?: string;
}

export function attachSourceReferencesToBlocks<TBlock extends DocumentBlock>(
  blocks: readonly TBlock[],
  context: SourceReferenceContext
): TBlock[] {
  return blocks.map((block, index) => {
    return attachBlockSourceReference(block, context, [`${context.prefix ?? 'body'}-block-${index}`]) as TBlock;
  });
}

export function attachSourceReferencesToAssets(
  assets: readonly DocumentAsset[],
  format: DocumentSourceFormat
): DocumentAsset[] {
  return assets.map((asset, index) => {
    const path = asset.path ?? `asset-${index}`;
    return {
      ...asset,
      sourceRef: asset.sourceRef ?? {
        format,
        path,
        role: 'asset',
        nodeId: `asset-${index}`,
        byteLength: asset.bytes.byteLength,
        rawPreserved: true
      },
      layoutBoxId: asset.layoutBoxId ?? sourceLayoutBoxId(format, -1, [`asset-${index}`])
    };
  });
}

function attachBlockSourceReference(
  block: DocumentBlock,
  context: SourceReferenceContext,
  pathParts: readonly string[]
): DocumentBlock {
  const sourceRef = buildSourceReference(context, pathParts, block.type);
  const layoutBoxId = sourceLayoutBoxId(context.format, context.sectionIndex, pathParts);

  if (block.type === 'paragraph') {
    return {
      ...block,
      sourceRef: block.sourceRef ?? sourceRef,
      layoutBoxId: block.layoutBoxId ?? layoutBoxId,
      runs: block.runs.map((run, index) => attachRunSourceReference(run, context, [...pathParts, `run-${index}`]))
    };
  }

  if (block.type === 'table') {
    return {
      ...block,
      sourceRef: block.sourceRef ?? sourceRef,
      layoutBoxId: block.layoutBoxId ?? layoutBoxId,
      rows: block.rows.map((row, index) => attachRowSourceReference(row, context, [...pathParts, `row-${index}`]))
    };
  }

  return {
    ...block,
    sourceRef: block.sourceRef ?? sourceRef,
    layoutBoxId: block.layoutBoxId ?? layoutBoxId
  };
}

function attachRunSourceReference(
  run: TextRun,
  context: SourceReferenceContext,
  pathParts: readonly string[]
): TextRun {
  return {
    ...run,
    sourceRef: run.sourceRef ?? buildSourceReference(context, pathParts, 'run'),
    layoutBoxId: run.layoutBoxId ?? sourceLayoutBoxId(context.format, context.sectionIndex, pathParts)
  };
}

function attachRowSourceReference(
  row: TableRow,
  context: SourceReferenceContext,
  pathParts: readonly string[]
): TableRow {
  return {
    ...row,
    sourceRef: row.sourceRef ?? buildSourceReference(context, pathParts, 'table-row'),
    layoutBoxId: row.layoutBoxId ?? sourceLayoutBoxId(context.format, context.sectionIndex, pathParts),
    cells: row.cells.map((cell, index) => attachCellSourceReference(cell, context, [...pathParts, `cell-${index}`]))
  };
}

function attachCellSourceReference(
  cell: TableCell,
  context: SourceReferenceContext,
  pathParts: readonly string[]
): TableCell {
  return {
    ...cell,
    sourceRef: cell.sourceRef ?? buildSourceReference(context, pathParts, 'table-cell'),
    layoutBoxId: cell.layoutBoxId ?? sourceLayoutBoxId(context.format, context.sectionIndex, pathParts),
    blocks: attachSourceReferencesToBlocks(cell.blocks, {
      ...context,
      prefix: pathParts.join('-')
    })
  };
}

function buildSourceReference(
  context: SourceReferenceContext,
  pathParts: readonly string[],
  nodeName: string
): SourceReference {
  const nodeId = pathParts.join('/');
  return {
    format: context.format,
    path: context.path,
    role: 'section',
    sectionIndex: context.sectionIndex,
    nodeName,
    nodeId,
    ...(context.format === 'hwpx' ? { xmlPath: nodeId } : {}),
    rawPreserved: true
  };
}

function sourceLayoutBoxId(format: DocumentSourceFormat, sectionIndex: number, pathParts: readonly string[]): string {
  return [format, sectionIndex, ...pathParts].join(':');
}
