import { useDroppable } from "@dnd-kit/core";
import { useMergeTree } from "../state/MergeTreeContext";
import { exportJson, exportXlsx } from "../export/exportTree";
import { MERGE_ROOT_DROP_ID } from "../dnd/dndTypes";
import { MergeTreeView } from "./MergeTree";

export function MergePanel() {
  const { tree, clearAll } = useMergeTree();
  const { setNodeRef, isOver } = useDroppable({ id: MERGE_ROOT_DROP_ID });

  return (
    <div className="merge-panel">
      <header className="panel-header">
        <div className="panel-title">
          <span className="panel-heading">Merge / Rearrange</span>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn"
            disabled={tree.length === 0}
            onClick={() => exportJson(tree)}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="btn"
            disabled={tree.length === 0}
            onClick={() => exportXlsx(tree)}
          >
            Export XLSX
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={tree.length === 0}
            onClick={() => {
              if (confirm("Clear the entire merge tree?")) clearAll();
            }}
          >
            Clear
          </button>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={`merge-body ${isOver ? "root-drop-target" : ""}`}
      >
        {tree.length === 0 ? (
          <div className="empty">
            <p>Drag code cards from either side.</p>
            <ul>
              <li>Drop on empty space → add as a new top-level node.</li>
              <li>Drop onto an existing node → nest under it.</li>
              <li>Shift + drop onto an existing node → merge into it.</li>
              <li>Double-click any field to edit. Drag to rearrange.</li>
            </ul>
          </div>
        ) : (
          <MergeTreeView />
        )}
      </div>
    </div>
  );
}
