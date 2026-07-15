import * as XLSX from "xlsx";
import type { MergeNode } from "../types";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportJson(tree: MergeNode[]) {
  download(
    `merged-codes-${Date.now()}.json`,
    JSON.stringify(tree, null, 2),
    "application/json"
  );
}

function maxDepth(nodes: MergeNode[]): number {
  let max = 0;
  const walk = (list: MergeNode[], depth: number) => {
    for (const n of list) {
      if (depth > max) max = depth;
      if (n.children.length) walk(n.children, depth + 1);
    }
  };
  walk(nodes, 1);
  return max;
}

function levelHeaders(levelCount: number): string[] {
  const base = ["Top-level code", "Sub-code", "Code"];
  const out: string[] = [];
  for (let i = 0; i < levelCount; i++) {
    out.push(i < base.length ? base[i] : `Level ${i + 1}`);
  }
  return out;
}

interface FlatRow {
  levels: string[];
  definition: string;
  originFiles: string;
  originPaths: string;
  note: string;
}

function formatOrigins(node: MergeNode): { files: string; paths: string } {
  const files = node.origins
    .map((o) => o.fileName ?? o.side)
    .join("; ");
  const paths = node.origins.map((o) => o.path.join(" > ")).join("; ");
  return { files, paths };
}

function walkFlatten(
  nodes: MergeNode[],
  ancestors: string[],
  levelCount: number,
  out: FlatRow[]
) {
  for (const n of nodes) {
    const path = [...ancestors, n.label];
    const levels = new Array<string>(levelCount).fill("");
    for (let i = 0; i < path.length && i < levelCount; i++) {
      levels[i] = path[i];
    }
    const isLeaf = n.children.length === 0;
    const hasContent =
      (n.definition && n.definition.trim() !== "") ||
      (n.note && n.note.trim() !== "");
    if (isLeaf || hasContent) {
      const { files, paths } = formatOrigins(n);
      out.push({
        levels,
        definition: n.definition ?? "",
        originFiles: files,
        originPaths: paths,
        note: n.note ?? "",
      });
    }
    if (n.children.length) walkFlatten(n.children, path, levelCount, out);
  }
}

export function exportXlsx(tree: MergeNode[]) {
  const depth = maxDepth(tree);
  const levelCount = Math.max(depth, 3);
  const headers = [
    ...levelHeaders(levelCount),
    "Definition",
    "Original file",
    "Original path",
    "Note",
  ];
  const rows: FlatRow[] = [];
  walkFlatten(tree, [], levelCount, rows);

  const aoa: unknown[][] = [headers];
  for (const r of rows) {
    aoa.push([
      ...r.levels,
      r.definition,
      r.originFiles,
      r.originPaths,
      r.note,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Codebook");
  XLSX.writeFile(wb, `merged-codes-${Date.now()}.xlsx`);
}
