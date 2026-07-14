import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MergeNode, OriginRef, Side, SourceNode } from "../types";
import { clearMergeTree, loadMergeTree, saveMergeTree } from "../storage/localStore";

let counter = 0;
const uid = () => `mrg_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function sourceToMerge(node: SourceNode, side: Side): MergeNode {
  const origin: OriginRef = {
    side,
    level: node.level,
    path: node.path,
    definition: node.definition,
  };
  return {
    id: uid(),
    label: node.label,
    definition: node.definition,
    note: "",
    origins: [origin],
    children: node.children.map((c) => sourceToMerge(c, side)),
  };
}

function findAll(nodes: MergeNode[], predicate: (n: MergeNode) => boolean): MergeNode[] {
  const out: MergeNode[] = [];
  const walk = (list: MergeNode[]) => {
    for (const n of list) {
      if (predicate(n)) out.push(n);
      if (n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function mapTree(
  nodes: MergeNode[],
  fn: (n: MergeNode) => MergeNode | null
): MergeNode[] {
  const out: MergeNode[] = [];
  for (const n of nodes) {
    const mapped = fn(n);
    if (mapped === null) continue;
    out.push({
      ...mapped,
      children: mapTree(mapped.children, fn),
    });
  }
  return out;
}

function findNode(nodes: MergeNode[], id: string): MergeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const inChild = findNode(n.children, id);
    if (inChild) return inChild;
  }
  return null;
}

function removeById(nodes: MergeNode[], id: string): MergeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeById(n.children, id) }));
}

function containsId(node: MergeNode, id: string): boolean {
  if (node.id === id) return true;
  return node.children.some((c) => containsId(c, id));
}

function insertUnder(
  nodes: MergeNode[],
  parentId: string | null,
  incoming: MergeNode
): MergeNode[] {
  if (parentId === null) return [...nodes, incoming];
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, incoming] }
      : { ...n, children: insertUnder(n.children, parentId, incoming) }
  );
}

interface MergeTreeContextValue {
  tree: MergeNode[];
  addSourceAsRoot: (source: SourceNode, side: Side) => void;
  addSourceUnder: (parentId: string, source: SourceNode, side: Side) => void;
  mergeSourceInto: (
    targetId: string,
    source: SourceNode,
    side: Side,
    combinedDefinition: string
  ) => void;
  mergeMergeInto: (
    sourceId: string,
    targetId: string,
    combinedDefinition: string,
    combinedNote: string
  ) => void;
  editNode: (id: string, patch: Partial<Pick<MergeNode, "label" | "definition" | "note">>) => void;
  deleteNode: (id: string) => void;
  toggleCollapse: (id: string) => void;
  reparent: (nodeId: string, newParentId: string | null) => void;
  clearAll: () => void;
  findByLabel: (label: string) => MergeNode[];
  getNode: (id: string) => MergeNode | null;
}

const Ctx = createContext<MergeTreeContextValue | null>(null);

export function MergeTreeProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<MergeNode[]>(() => loadMergeTree());

  useEffect(() => {
    saveMergeTree(tree);
  }, [tree]);

  const value = useMemo<MergeTreeContextValue>(
    () => ({
      tree,
      addSourceAsRoot: (source, side) => {
        const node = sourceToMerge(source, side);
        setTree((prev) => [...prev, node]);
      },
      addSourceUnder: (parentId, source, side) => {
        const node = sourceToMerge(source, side);
        setTree((prev) => insertUnder(prev, parentId, node));
      },
      mergeSourceInto: (targetId, source, side, combinedDefinition) => {
        const incomingOrigin: OriginRef = {
          side,
          level: source.level,
          path: source.path,
          definition: source.definition,
        };
        setTree((prev) =>
          mapTree(prev, (n) => {
            if (n.id !== targetId) return n;
            const mergedChildren = source.children.map((c) =>
              sourceToMerge(c, side)
            );
            return {
              ...n,
              definition: combinedDefinition,
              origins: [...n.origins, incomingOrigin],
              children: [...n.children, ...mergedChildren],
            };
          })
        );
      },
      mergeMergeInto: (sourceId, targetId, combinedDefinition, combinedNote) => {
        setTree((prev) => {
          if (sourceId === targetId) return prev;
          const sourceNode = findNode(prev, sourceId);
          if (!sourceNode) return prev;
          // Guard: cannot merge an ancestor into its own descendant
          if (containsId(sourceNode, targetId)) return prev;
          const withoutSource = removeById(prev, sourceId);
          return mapTree(withoutSource, (n) => {
            if (n.id !== targetId) return n;
            return {
              ...n,
              definition: combinedDefinition,
              note: combinedNote,
              origins: [...n.origins, ...sourceNode.origins],
              children: [...n.children, ...sourceNode.children],
            };
          });
        });
      },
      editNode: (id, patch) => {
        setTree((prev) =>
          mapTree(prev, (n) => (n.id === id ? { ...n, ...patch } : n))
        );
      },
      deleteNode: (id) => {
        setTree((prev) => removeById(prev, id));
      },
      toggleCollapse: (id) => {
        setTree((prev) =>
          mapTree(prev, (n) =>
            n.id === id ? { ...n, collapsed: !n.collapsed } : n
          )
        );
      },
      reparent: (nodeId, newParentId) => {
        setTree((prev) => {
          const node = findNode(prev, nodeId);
          if (!node) return prev;
          if (newParentId && containsId(node, newParentId)) return prev;
          const withoutNode = removeById(prev, nodeId);
          return insertUnder(withoutNode, newParentId, node);
        });
      },
      clearAll: () => {
        setTree([]);
        clearMergeTree();
      },
      findByLabel: (label) => {
        const norm = label.trim().toLowerCase();
        return findAll(tree, (n) => n.label.trim().toLowerCase() === norm);
      },
      getNode: (id) => findNode(tree, id),
    }),
    [tree]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMergeTree() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMergeTree must be used inside MergeTreeProvider");
  return v;
}
