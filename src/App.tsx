import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { SourceProvider } from "./state/SourceContext";
import {
  MergeTreeProvider,
  useMergeTree,
} from "./state/MergeTreeContext";
import { SplitLayout } from "./components/SplitLayout";
import { SourcePanel } from "./components/SourcePanel";
import { MergePanel } from "./components/MergePanel";
import { ConfirmDuplicateDialog } from "./components/ConfirmDuplicateDialog";
import { ConfirmMergeDefinitionDialog } from "./components/ConfirmMergeDefinitionDialog";
import {
  MERGE_DRAG_ID_PREFIX,
  MERGE_NODE_DROP_PREFIX,
  MERGE_ROOT_DROP_ID,
} from "./dnd/dndTypes";
import type {
  DragPayload,
  MergeNode,
  Side,
  SourceNode as SourceNodeT,
} from "./types";

type PendingMerge =
  | {
      kind: "source";
      targetId: string;
      targetLabel: string;
      targetDefinition: string;
      targetNote: string;
      source: SourceNodeT;
      side: Side;
    }
  | {
      kind: "merge";
      targetId: string;
      targetLabel: string;
      targetDefinition: string;
      targetNote: string;
      sourceId: string;
      sourceLabel: string;
      sourceDefinition: string;
      sourceNote: string;
    };

interface PendingDuplicate {
  source: SourceNodeT;
  side: Side;
  duplicates: MergeNode[];
}

function Orchestrator() {
  const {
    addSourceAsRoot,
    addSourceUnder,
    mergeSourceInto,
    mergeMergeInto,
    reparent,
    findByLabel,
    getNode,
  } = useMergeTree();

  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const [pendingMerge, setPendingMerge] = useState<PendingMerge | null>(null);
  const [pendingDup, setPendingDup] = useState<PendingDuplicate | null>(null);
  const shiftHeldRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      shiftHeldRef.current = e.shiftKey;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(e: DragStartEvent) {
    const payload = e.active.data.current?.payload as DragPayload | undefined;
    if (payload) setActiveDrag(payload);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = e;
    if (!over) return;

    const payload = active.data.current?.payload as DragPayload | undefined;
    if (!payload) return;

    const overId = String(over.id);
    const shift = shiftHeldRef.current;

    if (payload.kind === "source") {
      if (overId === MERGE_ROOT_DROP_ID) {
        const dups = findByLabel(payload.node.label);
        if (dups.length > 0) {
          setPendingDup({
            source: payload.node,
            side: payload.side,
            duplicates: dups,
          });
        } else {
          addSourceAsRoot(payload.node, payload.side);
        }
        return;
      }
      if (overId.startsWith(MERGE_NODE_DROP_PREFIX)) {
        const targetId = overId.slice(MERGE_NODE_DROP_PREFIX.length);
        const target = getNode(targetId);
        if (!target) return;
        if (shift) {
          setPendingMerge({
            kind: "source",
            targetId,
            targetLabel: target.label,
            targetDefinition: target.definition,
            targetNote: target.note,
            source: payload.node,
            side: payload.side,
          });
        } else {
          addSourceUnder(targetId, payload.node, payload.side);
        }
        return;
      }
      return;
    }

    if (payload.kind === "merge") {
      const draggedId = String(active.id).slice(MERGE_DRAG_ID_PREFIX.length);
      if (overId === MERGE_ROOT_DROP_ID) {
        reparent(draggedId, null);
        return;
      }
      if (overId.startsWith(MERGE_NODE_DROP_PREFIX)) {
        const targetId = overId.slice(MERGE_NODE_DROP_PREFIX.length);
        if (targetId === draggedId) return;
        if (shift) {
          const target = getNode(targetId);
          const dragged = getNode(draggedId);
          if (!target || !dragged) return;
          setPendingMerge({
            kind: "merge",
            targetId,
            targetLabel: target.label,
            targetDefinition: target.definition,
            targetNote: target.note,
            sourceId: draggedId,
            sourceLabel: dragged.label,
            sourceDefinition: dragged.definition,
            sourceNote: dragged.note,
          });
        } else {
          reparent(draggedId, targetId);
        }
        return;
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <SplitLayout
        left={<SourcePanel side="LEFT" />}
        middle={<MergePanel />}
        right={<SourcePanel side="RIGHT" />}
      />

      <DragOverlay dropAnimation={null}>
        {activeDrag ? <DragPreview payload={activeDrag} /> : null}
      </DragOverlay>

      {pendingDup && (
        <ConfirmDuplicateDialog
          incomingLabel={pendingDup.source.label}
          duplicates={pendingDup.duplicates}
          onAddAnyway={() => {
            addSourceAsRoot(pendingDup.source, pendingDup.side);
            setPendingDup(null);
          }}
          onMergeInto={(targetId) => {
            const target = getNode(targetId);
            if (target) {
              setPendingMerge({
                kind: "source",
                targetId,
                targetLabel: target.label,
                targetDefinition: target.definition,
                targetNote: target.note,
                source: pendingDup.source,
                side: pendingDup.side,
              });
            }
            setPendingDup(null);
          }}
          onCancel={() => setPendingDup(null)}
        />
      )}

      {pendingMerge && (
        <ConfirmMergeDefinitionDialog
          existingLabel={pendingMerge.targetLabel}
          existingDefinition={pendingMerge.targetDefinition}
          incomingLabel={
            pendingMerge.kind === "source"
              ? pendingMerge.source.label
              : pendingMerge.sourceLabel
          }
          incomingDefinition={
            pendingMerge.kind === "source"
              ? pendingMerge.source.definition
              : pendingMerge.sourceDefinition
          }
          existingNote={
            pendingMerge.kind === "merge" ? pendingMerge.targetNote : undefined
          }
          incomingNote={
            pendingMerge.kind === "merge" ? pendingMerge.sourceNote : undefined
          }
          onConfirm={(combinedDef, combinedNote) => {
            if (pendingMerge.kind === "source") {
              mergeSourceInto(
                pendingMerge.targetId,
                pendingMerge.source,
                pendingMerge.side,
                combinedDef
              );
            } else {
              const resolvedNote =
                combinedNote !== undefined
                  ? combinedNote
                  : pendingMerge.targetNote || pendingMerge.sourceNote;
              mergeMergeInto(
                pendingMerge.sourceId,
                pendingMerge.targetId,
                combinedDef,
                resolvedNote
              );
            }
            setPendingMerge(null);
          }}
          onCancel={() => setPendingMerge(null)}
        />
      )}
    </DndContext>
  );
}

function DragPreview({ payload }: { payload: DragPayload }) {
  if (payload.kind === "source") {
    const n = payload.node;
    const count = countDescendants(n);
    return (
      <div className="drag-preview">
        <span className="side-tag">{payload.side}</span>
        <strong>{n.label}</strong>
        <span className="muted">
          {n.level}
          {count > 0 ? ` · +${count} descendant${count === 1 ? "" : "s"}` : ""}
        </span>
      </div>
    );
  }
  return (
    <div className="drag-preview">
      <strong>{payload.node.label}</strong>
      <span className="muted">merge node</span>
    </div>
  );
}

function countDescendants(n: SourceNodeT): number {
  let c = n.children.length;
  for (const child of n.children) c += countDescendants(child);
  return c;
}

export default function App() {
  return (
    <SourceProvider>
      <MergeTreeProvider>
        <Orchestrator />
      </MergeTreeProvider>
    </SourceProvider>
  );
}
