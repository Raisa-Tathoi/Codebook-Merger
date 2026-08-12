import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import type { MergeNode as MergeNodeT } from "../types";
import { useMergeTree } from "../state/MergeTreeContext";
import {
  MERGE_DRAG_ID_PREFIX,
  MERGE_NODE_DROP_PREFIX,
} from "../dnd/dndTypes";
import { OriginBadge } from "./OriginBadge";

interface Props {
  node: MergeNodeT;
  depth: number;
}

export function MergeNodeView({ node, depth }: Props) {
  const { editNode, deleteNode, toggleCollapse } = useMergeTree();
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingDef, setEditingDef] = useState(false);
  const [editingNote, setEditingNote] = useState(false);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } =
    useDraggable({
      id: `${MERGE_DRAG_ID_PREFIX}${node.id}`,
      data: { payload: { kind: "merge", node } },
    });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${MERGE_NODE_DROP_PREFIX}${node.id}`,
    data: { targetId: node.id },
  });

  function attachRefs(el: HTMLDivElement | null) {
    setDragRef(el);
    setDropRef(el);
  }

  const hasChildren = node.children.length > 0;
  const collapsed = node.collapsed ?? false;

  return (
    <div className="merge-node" style={{ marginLeft: depth * 14 }}>
      <div
        ref={attachRefs}
        className={`card merge-card origin-${originClass(node)} ${
          isDragging ? "dragging" : ""
        } ${isOver ? "drop-target" : ""}`}
        {...attributes}
        {...listeners}
      >
        <div className="card-row">
          {hasChildren && (
            <button
              type="button"
              className="disclosure"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "▸" : "▾"}
            </button>
          )}
          <OriginBadge origins={node.origins} />
          {editingLabel ? (
            <input
              autoFocus
              className="inline-input"
              defaultValue={node.label}
              onPointerDown={(e) => e.stopPropagation()}
              onBlur={(e) => {
                editNode(node.id, { label: e.target.value.trim() || node.label });
                setEditingLabel(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingLabel(false);
              }}
            />
          ) : (
            <span
              className="card-label editable"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingLabel(true);
              }}
              title="Double-click to rename"
            >
              {node.label}
            </span>
          )}
          <div className="node-actions" onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setEditingDef((v) => !v)}
              title="Edit definition"
            >
              def
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setEditingNote((v) => !v)}
              title="Edit note"
            >
              note
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => {
                if (
                  confirm(
                    `Delete "${node.label}"${
                      hasChildren ? " and its descendants" : ""
                    }?`
                  )
                ) {
                  deleteNode(node.id);
                }
              }}
              title="Delete"
            >
              ×
            </button>
          </div>
        </div>

        {editingDef ? (
          <textarea
            className="inline-textarea"
            defaultValue={node.definition}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              editNode(node.id, { definition: e.target.value });
              setEditingDef(false);
            }}
          />
        ) : (
          node.definition && (
            <div
              className="card-def editable"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingDef(true);
              }}
              title="Double-click to edit definition"
            >
              {node.definition}
            </div>
          )
        )}

        {editingNote ? (
          <textarea
            className="inline-textarea"
            placeholder="note"
            defaultValue={node.note}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              editNode(node.id, { note: e.target.value });
              setEditingNote(false);
            }}
          />
        ) : (
          node.note && (
            <div
              className="card-note editable"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingNote(true);
              }}
            >
              note: {node.note}
            </div>
          )
        )}

        <div className="origin-trail">
          {node.origins.map((o, i) => (
            <div key={i} className="origin-line">
              <span className={`side-tag side-${o.side.toLowerCase()}`}>
                {o.side}
              </span>
              <span className="origin-level">{o.level}</span>
              <span className="origin-path">{o.path.join(" › ")}</span>
            </div>
          ))}
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div className="merge-children">
          {node.children.map((c) => (
            <MergeNodeView key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function originClass(node: MergeNodeT): "left" | "right" | "merged" {
  const hasLeft = node.origins.some((o) => o.side === "LEFT");
  const hasRight = node.origins.some((o) => o.side === "RIGHT");
  if (hasLeft && hasRight) return "merged";
  if (hasLeft) return "left";
  return "right";
}
