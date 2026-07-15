export type Side = "LEFT" | "RIGHT";

export type SourceLevel = "top" | "sub" | "code";

export interface SourceNode {
  id: string;
  level: SourceLevel;
  label: string;
  definition: string;
  children: SourceNode[];
  path: string[];
}

export interface OriginRef {
  side: Side;
  level: SourceLevel;
  path: string[];
  definition: string;
  fileName?: string;
}

export interface MergeNode {
  id: string;
  label: string;
  definition: string;
  note: string;
  origins: OriginRef[];
  children: MergeNode[];
  collapsed?: boolean;
}

export interface SourceTree {
  fileName: string;
  roots: SourceNode[];
}

export type DragPayload =
  | { kind: "source"; side: Side; node: SourceNode }
  | { kind: "merge"; node: MergeNode };
