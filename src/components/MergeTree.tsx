import { useMergeTree } from "../state/MergeTreeContext";
import { MergeNodeView } from "./MergeNode";

export function MergeTreeView() {
  const { tree } = useMergeTree();
  if (tree.length === 0) {
    return null;
  }
  return (
    <div className="merge-tree">
      {tree.map((n) => (
        <MergeNodeView key={n.id} node={n} depth={0} />
      ))}
    </div>
  );
}
