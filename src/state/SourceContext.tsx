import { createContext, useContext, useState, type ReactNode } from "react";
import type { Side, SourceNode, SourceTree } from "../types";

interface SourceContextValue {
  left: SourceTree | null;
  right: SourceTree | null;
  setSide: (side: Side, tree: SourceTree | null) => void;
  editDefinition: (side: Side, id: string, definition: string) => void;
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

  return (
    <Ctx.Provider value={{ left, right, setSide, editDefinition }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSources() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSources must be used inside SourceProvider");
  return v;
}
