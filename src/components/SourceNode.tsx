import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import type { Side, SourceNode as SourceNodeT } from "../types";
import {
  SOURCE_DRAG_ID_PREFIX,
  SOURCE_NODE_DROP_PREFIX,
} from "../dnd/dndTypes";
import { useSources } from "../state/SourceContext";
import { useMergeTree } from "../state/MergeTreeContext";

interface Props {
  node: SourceNodeT;
  side: Side;
  depth: number;
}

const LEVEL_LABEL: Record<SourceNodeT["level"], string> = {
  top: "TOP",
  sub: "SUB",
  code: "CODE",
};

export function SourceNodeView({ node, side, depth }: Props) {
  const [open, setOpen] = useState(depth < 1);
  const [editingDef, setEditingDef] = useState(false);
  const { editDefinition } = useSources();
  const { isSourceUsed } = useMergeTree();
  const hasChildren = node.children.length > 0;
  const used = isSourceUsed(side, node.path);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `${SOURCE_DRAG_ID_PREFIX}${node.id}`,
    data: { payload: { kind: "source", side, node } },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${SOURCE_NODE_DROP_PREFIX}${node.id}`,
    data: { targetId: node.id, side },
  });

  function attachRefs(el: HTMLDivElement | null) {
    setDragRef(el);
    setDropRef(el);
  }

  return (
    <div className="source-node" style={{ marginLeft: depth * 12 }}>
      <div
        ref={attachRefs}
        {...listeners}
        {...attributes}
        className={`card source-card level-${node.level} ${
          isDragging ? "dragging" : ""
        } ${used ? "used" : ""} ${isOver && !isDragging ? "drop-target" : ""}`}
      >
        <div className="card-row">
          {hasChildren && (
            <button
              type="button"
              className="disclosure"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => !o);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={open ? "Collapse" : "Expand"}
            >
              {open ? "▾" : "▸"}
            </button>
          )}
          <span className="level-tag">{LEVEL_LABEL[node.level]}</span>
          <span className="card-label">{node.label}</span>
        </div>
        {editingDef ? (
          <textarea
            autoFocus
            className="inline-textarea"
            defaultValue={node.definition}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              editDefinition(side, node.id, e.target.value);
              setEditingDef(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingDef(false);
            }}
          />
        ) : node.definition ? (
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
        ) : (
          <button
            type="button"
            className="add-def-link"
            onClick={(e) => {
              e.stopPropagation();
              setEditingDef(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            + add definition
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="source-children">
          {node.children.map((c) => (
            <SourceNodeView key={c.id} node={c} side={side} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
