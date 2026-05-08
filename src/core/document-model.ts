export type DocumentSourceFormat = 'hwp' | 'hwpx';

export interface ParsedDocument {
  readonly format: DocumentSourceFormat;
  readonly title: string;
  readonly metadata: DocumentMetadata;
  readonly source?: SourceDocument;
  readonly layoutTree?: LayoutTree;
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
  readonly sourceRef?: SourceReference;
}

export type DocumentBlock = ParagraphBlock | TableBlock | ImageBlock;

export interface ParagraphBlock {
  readonly type: 'paragraph';
  readonly runs: TextRun[];
  readonly align?: 'left' | 'center' | 'right' | 'justify';
  readonly styleId?: string;
  readonly margin?: BoxSpacing;
  readonly textIndent?: number;
  readonly lineHeight?: string;
  readonly sourceRef?: SourceReference;
}

export interface TableBlock {
  readonly type: 'table';
  readonly rows: TableRow[];
  readonly width?: number;
  readonly columnWidths?: number[];
  readonly border?: string;
  readonly borderEdges?: BorderEdges;
  readonly background?: string;
  readonly sourceRef?: SourceReference;
}

export interface ImageBlock {
  readonly type: 'image';
  readonly assetId: string;
  readonly altText: string;
  readonly width?: number;
  readonly height?: number;
  readonly inline?: boolean;
  readonly sourceRef?: SourceReference;
}

export interface TextRun {
  readonly text: string;
  readonly styleId?: string;
  readonly href?: string;
  readonly fontFamily?: string;
  readonly fontSizePt?: number;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly letterSpacing?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strike?: boolean;
  readonly sourceRef?: SourceReference;
}

export interface TableRow {
  readonly cells: TableCell[];
  readonly sourceRef?: SourceReference;
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
  readonly sourceRef?: SourceReference;
}

export interface DocumentAsset {
  readonly id: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array;
  readonly path?: string;
  readonly sourceRef?: SourceReference;
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

export type SourceEntryKind = 'root' | 'storage' | 'stream' | 'xml' | 'binary' | 'text' | 'package';

export type SourceEntryRole =
  | 'file-header'
  | 'document-info'
  | 'section'
  | 'styles'
  | 'manifest'
  | 'content'
  | 'asset'
  | 'preview'
  | 'metadata'
  | 'unknown';

export interface SourceDocument {
  readonly format: DocumentSourceFormat;
  readonly container: SourceContainer;
  readonly entries: readonly SourceEntry[];
  readonly sections: readonly SourceSection[];
  readonly assets: readonly SourceAssetReference[];
  readonly diagnostics?: readonly SourceDiagnostic[];
}

export interface SourceContainer {
  readonly kind: 'cfb' | 'zip-xml';
  readonly entryCount: number;
  readonly signature?: string;
  readonly version?: string;
  readonly compressed?: boolean;
  readonly encrypted?: boolean;
  readonly distributed?: boolean;
}

export interface SourceEntry {
  readonly path: string;
  readonly kind: SourceEntryKind;
  readonly role: SourceEntryRole;
  readonly byteLength?: number;
  readonly preserved: boolean;
  readonly sourceRef: SourceReference;
}

export interface SourceSection {
  readonly id: string;
  readonly index: number;
  readonly entryPath: string;
  readonly blockCount?: number;
  readonly pageStartIndex?: number;
  readonly pageCount?: number;
  readonly sourceRef: SourceReference;
}

export interface SourceAssetReference {
  readonly id: string;
  readonly path?: string;
  readonly mimeType?: string;
  readonly byteLength?: number;
  readonly sourceRef: SourceReference;
}

export interface SourceReference {
  readonly format: DocumentSourceFormat;
  readonly path?: string;
  readonly role?: SourceEntryRole | string;
  readonly sectionIndex?: number;
  readonly recordIndex?: number;
  readonly tagId?: number | string;
  readonly nodeName?: string;
  readonly nodeId?: string;
  readonly xmlPath?: string;
  readonly byteOffset?: number;
  readonly byteLength?: number;
  readonly rawPreserved?: boolean;
}

export interface SourceDiagnostic {
  readonly severity: 'info' | 'warning' | 'error';
  readonly code: string;
  readonly message: string;
  readonly sourceRef?: SourceReference;
}

export interface LayoutTree {
  readonly pages: readonly LayoutPage[];
  readonly diagnostics?: readonly LayoutDiagnostic[];
}

export interface LayoutPage {
  readonly index: number;
  readonly layout: PageLayout;
  readonly boxes: readonly LayoutBox[];
  readonly sourceRef?: SourceReference;
}

export type LayoutBoxKind =
  | 'page'
  | 'body'
  | 'header'
  | 'footer'
  | 'paragraph'
  | 'line'
  | 'run'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'image'
  | 'object'
  | 'decoration'
  | 'unknown';

export interface LayoutBox {
  readonly id: string;
  readonly kind: LayoutBoxKind;
  readonly rect: LayoutRect;
  readonly children?: readonly LayoutBox[];
  readonly sourceRef?: SourceReference;
  readonly zIndex?: number;
  readonly flow?: 'flow' | 'absolute' | 'inline-offset' | 'nested-absolute';
  readonly fragmentOf?: string;
  readonly overflow?: 'visible' | 'hidden' | 'clip' | 'scroll';
}

export interface LayoutRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutDiagnostic {
  readonly severity: 'info' | 'warning' | 'error';
  readonly code: string;
  readonly message: string;
  readonly boxId?: string;
  readonly sourceRef?: SourceReference;
}
