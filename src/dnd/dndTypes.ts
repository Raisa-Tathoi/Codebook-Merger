import type { DragPayload } from "../types";

export const SOURCE_DRAG_ID_PREFIX = "source:";
export const SOURCE_NODE_DROP_PREFIX = "source-node:";
export const MERGE_DRAG_ID_PREFIX = "merge:";
export const MERGE_ROOT_DROP_ID = "merge-root";
export const MERGE_NODE_DROP_PREFIX = "merge-node:";

export interface ActiveDragData {
  payload: DragPayload;
}
