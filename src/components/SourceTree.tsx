import type { Side, SourceTree } from "../types";
import { SourceNodeView } from "./SourceNode";

interface Props {
  tree: SourceTree;
  side: Side;
}

export function SourceTreeView({ tree, side }: Props) {
  if (tree.roots.length === 0) {
    return <div className="empty">No rows parsed from this file.</div>;
  }
  return (
    <div className="source-tree">
      {tree.roots.map((r) => (
        <SourceNodeView key={r.id} node={r} side={side} depth={0} />
      ))}
    </div>
  );
}
