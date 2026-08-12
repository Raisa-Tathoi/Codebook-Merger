import { createContext, useContext, useState, type ReactNode } from "react";
import type { Side, SourceNode, SourceTree } from "../types";

interface SourceContextValue {
  left: SourceTree | null;
  right: SourceTree | null;
  setSide: (side: Side, tree: SourceTree | null) => void;
  editDefinition: (side: Side, id: string, definition: string) => void;
  reorderSibling: (side: Side, draggedId: string, targetId: string) => void;
}

const Ctx = createContext<SourceContextValue | null>(null);

function updateDefinition(
  nodes: SourceNode[],
  id: string,
  definition: string
): SourceNode[] {
  return nodes.map((n) =>
    n.id === id
      ? { ...n, definition }
      : { ...n, children: updateDefinition(n.children, id, definition) }
  );
}

function findParentId(
  nodes: SourceNode[],
  id: string
): { parentId: string | null } | null {
  const walk = (
    list: SourceNode[],
    parentId: string | null
  ): { parentId: string | null } | null => {
    for (const n of list) {
      if (n.id === id) return { parentId };
      const inChild = walk(n.children, n.id);
      if (inChild) return inChild;
    }
    return null;
  };
  return walk(nodes, null);
}

function mapChildrenOf(
  nodes: SourceNode[],
  parentId: string,
  rewrite: (list: SourceNode[]) => SourceNode[]
): SourceNode[] {
  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: rewrite(n.children) };
    }
    return { ...n, children: mapChildrenOf(n.children, parentId, rewrite) };
  });
}

function reorderList(
  list: SourceNode[],
  draggedId: string,
  targetId: string
): SourceNode[] {
  const draggedIdx = list.findIndex((n) => n.id === draggedId);
  const targetIdx = list.findIndex((n) => n.id === targetId);
  if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) {
    return list;
  }
  const next = list.slice();
  const [dragged] = next.splice(draggedIdx, 1);
  next.splice(targetIdx, 0, dragged);
  return next;
}

export function SourceProvider({ children }: { children: ReactNode }) {
  const [left, setLeft] = useState<SourceTree | null>(null);
  const [right, setRight] = useState<SourceTree | null>(null);

  const setSide = (side: Side, tree: SourceTree | null) => {
    if (side === "LEFT") setLeft(tree);
    else setRight(tree);
  };

  const editDefinition = (side: Side, id: string, definition: string) => {
    const setter = side === "LEFT" ? setLeft : setRight;
    setter((prev) =>
      prev ? { ...prev, roots: updateDefinition(prev.roots, id, definition) } : prev
    );
  };

  const reorderSibling = (
    side: Side,
    draggedId: string,
    targetId: string
  ) => {
    if (draggedId === targetId) return;
    const setter = side === "LEFT" ? setLeft : setRight;
    setter((prev) => {
      if (!prev) return prev;
      const draggedInfo = findParentId(prev.roots, draggedId);
      const targetInfo = findParentId(prev.roots, targetId);
      if (!draggedInfo || !targetInfo) return prev;
      if (draggedInfo.parentId !== targetInfo.parentId) return prev;
      if (draggedInfo.parentId === null) {
        return { ...prev, roots: reorderList(prev.roots, draggedId, targetId) };
      }
      return {
        ...prev,
        roots: mapChildrenOf(prev.roots, draggedInfo.parentId, (list) =>
          reorderList(list, draggedId, targetId)
        ),
      };
    });
  };

  return (
    <Ctx.Provider
      value={{ left, right, setSide, editDefinition, reorderSibling }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSources() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSources must be used inside SourceProvider");
  return v;
}
