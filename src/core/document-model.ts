export type DocumentSourceFormat = 'hwp' | 'hwpx';

export interface ParsedDocument {
  readonly format: DocumentSourceFormat;
  readonly title: string;
  readonly metadata: DocumentMetadata;
  readonly pages: DocumentPage[];
  readonly assets: DocumentAsset[];
}

export interface DocumentMetadata {
  readonly sectionCount: number;
  readonly assetCount: number;
  readonly parser: string;
  readonly warnings: string[];
  readonly details?: Record<string, string | number | boolean | string[] | number[]>;
}

export interface DocumentPage {
  readonly index: number;
  readonly blocks: DocumentBlock[];
  readonly layout?: PageLayout;
}

export type DocumentBlock = ParagraphBlock | TableBlock | ImageBlock;

export interface ParagraphBlock {
  readonly type: 'paragraph';
  readonly runs: TextRun[];
  readonly align?: 'left' | 'center' | 'right' | 'justify';
  readonly styleId?: string;
  readonly margin?: BoxSpacing;
  readonly lineHeight?: string;
}

export interface TableBlock {
  readonly type: 'table';
  readonly rows: TableRow[];
  readonly width?: number;
  readonly columnWidths?: number[];
  readonly border?: string;
  readonly borderEdges?: BorderEdges;
  readonly background?: string;
}

export interface ImageBlock {
  readonly type: 'image';
  readonly assetId: string;
  readonly altText: string;
  readonly width?: number;
  readonly height?: number;
  readonly inline?: boolean;
}

export interface TextRun {
  readonly text: string;
  readonly styleId?: string;
  readonly fontFamily?: string;
  readonly fontSizePt?: number;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly letterSpacing?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strike?: boolean;
}

export interface TableRow {
  readonly cells: TableCell[];
}

export interface TableCell {
  readonly blocks: DocumentBlock[];
  readonly colSpan: number;
  readonly rowSpan: number;
  readonly width?: number;
  readonly height?: number;
  readonly padding?: BoxSpacing;
  readonly align?: 'left' | 'center' | 'right' | 'justify';
  readonly verticalAlign?: 'top' | 'middle' | 'bottom';
  readonly border?: string;
  readonly borderEdges?: BorderEdges;
  readonly background?: string;
}

export interface DocumentAsset {
  readonly id: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array;
  readonly path?: string;
}

export interface PageLayout {
  readonly width: number;
  readonly height: number;
  readonly margin: BoxSpacing;
  readonly decorationInset?: BoxSpacing;
}

export interface BoxSpacing {
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly left?: number;
}

export interface BorderEdges {
  readonly top?: string;
  readonly right?: string;
  readonly bottom?: string;
  readonly left?: string;
}
