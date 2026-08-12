import type { MergeNode } from "../types";

const KEY = "code-system-comparator:mergeTree:v1";

export function loadMergeTree(): MergeNode[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as MergeNode[];
  } catch {
    return [];
  }
}

export function saveMergeTree(tree: MergeNode[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tree));
  } catch {
    // Ignore quota errors silently; the app remains usable in-memory.
  }
}

export function clearMergeTree(): void {
  localStorage.removeItem(KEY);
}
