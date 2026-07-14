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

interface FlatRow {
  path: string;
  label: string;
  definition: string;
  note: string;
  origins: string;
}

function walk(nodes: MergeNode[], parentPath: string[], out: FlatRow[]) {
  for (const n of nodes) {
    const currentPath = [...parentPath, n.label];
    out.push({
      path: currentPath.join(" > "),
      label: n.label,
      definition: n.definition,
      note: n.note,
      origins: n.origins
        .map((o) => `${o.side}:${o.level}:${o.path.join(">")}`)
        .join(" | "),
    });
    if (n.children.length) walk(n.children, currentPath, out);
  }
}

function csvEscape(v: string): string {
  const needsQuote = /[",\n\r]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function exportCsv(tree: MergeNode[]) {
  const rows: FlatRow[] = [];
  walk(tree, [], rows);
  const header = ["path", "label", "definition", "note", "origins"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.path, r.label, r.definition, r.note, r.origins].map(csvEscape).join(",")
    );
  }
  download(`merged-codes-${Date.now()}.csv`, lines.join("\n"), "text/csv");
}
