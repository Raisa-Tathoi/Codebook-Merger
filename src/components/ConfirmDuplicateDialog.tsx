import { useState } from "react";
import type { MergeNode } from "../types";

interface Props {
  incomingLabel: string;
  duplicates: MergeNode[];
  onAddAnyway: () => void;
  onMergeInto: (targetId: string) => void;
  onCancel: () => void;
}

export function ConfirmDuplicateDialog({
  incomingLabel,
  duplicates,
  onAddAnyway,
  onMergeInto,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<string>(duplicates[0]?.id ?? "");

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Duplicate code detected</h3>
        <p>
          A code labeled <strong>"{incomingLabel}"</strong> already exists in the
          merge tree ({duplicates.length} match
          {duplicates.length === 1 ? "" : "es"}).
        </p>

        {duplicates.length > 1 && (
          <label className="modal-field">
            <span>Merge target:</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {duplicates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — {d.origins.map((o) => o.side).join("+")} —{" "}
                  {d.origins[0]?.path.join(" › ") ?? ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={onAddAnyway}>
            Add as new node
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onMergeInto(selected)}
            disabled={!selected}
          >
            Merge into existing
          </button>
        </div>
      </div>
    </div>
  );
}
