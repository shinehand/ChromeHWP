import '../document-model';

declare module '../document-model' {
  interface ParagraphBlock {
    readonly _hwpxLayout?: {
      readonly heightPx: number;
      readonly lineSegments?: readonly {
        readonly index: number;
        readonly textPosition: number;
        readonly verticalPosition: number;
        readonly verticalSize: number;
        readonly textHeight: number;
        readonly baseline: number;
        readonly spacing: number;
        readonly horizontalPosition: number;
        readonly horizontalSize: number;
        readonly flags: number;
        readonly heightPx: number;
      }[];
      readonly breakBefore?: boolean;
      readonly breakAfter?: boolean;
      readonly pageBreak?: string;
      readonly source?: string;
      readonly position?: {
        readonly leftPx: number;
        readonly topPx: number;
        readonly widthPx?: number;
        readonly heightPx?: number;
        readonly zIndex?: number;
        readonly source?: string;
        readonly horizontalRelTo?: string;
        readonly verticalRelTo?: string;
        readonly horizontalAlign?: string;
        readonly verticalAlign?: string;
      };
    };
  }

  interface TableBlock {
    readonly _hwpxLayout?: {
      readonly heightPx: number;
      readonly renderHeightPx?: number;
      readonly repeatHeaderRows?: number;
      readonly rowHeightsPx?: readonly number[];
      readonly source?: string;
      readonly pageBreak?: string;
      readonly colCount?: number;
      readonly position?: {
        readonly leftPx: number;
        readonly topPx: number;
        readonly widthPx?: number;
        readonly heightPx?: number;
        readonly zIndex?: number;
        readonly source?: string;
        readonly horizontalRelTo?: string;
        readonly verticalRelTo?: string;
        readonly horizontalAlign?: string;
        readonly verticalAlign?: string;
      };
    };
  }

  interface TableRow {
    readonly _hwpxLayout?: {
      readonly rowIndex: number;
      readonly heightPx: number;
      readonly renderHeightPx?: number;
    };
  }

  interface TableCell {
    readonly _hwpxLayout?: {
      readonly rowIndex?: number;
      readonly colIndex?: number;
      readonly colSpan?: number;
      readonly rowSpan?: number;
      readonly sourceHeightPx?: number;
      readonly contentHeightPx?: number;
      readonly heightPx?: number;
      readonly renderHeightPx?: number;
      readonly isHeader?: boolean;
    };
  }

  interface ImageBlock {
    readonly _hwpxLayout?: {
      readonly heightPx: number;
      readonly source?: string;
      readonly flowWithText?: boolean;
      readonly allowOverlap?: boolean;
      readonly position?: {
        readonly leftPx: number;
        readonly topPx: number;
        readonly widthPx?: number;
        readonly heightPx?: number;
        readonly zIndex?: number;
        readonly source?: string;
        readonly horizontalRelTo?: string;
        readonly verticalRelTo?: string;
        readonly horizontalAlign?: string;
        readonly verticalAlign?: string;
      };
    };
  }
}
