import { useState } from "react";

interface Props {
  existingLabel: string;
  existingDefinition: string;
  incomingLabel: string;
  incomingDefinition: string;
  existingNote?: string;
  incomingNote?: string;
  onConfirm: (combinedDefinition: string, combinedNote?: string) => void;
  onCancel: () => void;
}

export function ConfirmMergeDefinitionDialog({
  existingLabel,
  existingDefinition,
  incomingLabel,
  incomingDefinition,
  existingNote,
  incomingNote,
  onConfirm,
  onCancel,
}: Props) {
  const defSuggestion =
    `EXISTING (${existingLabel}):\n${existingDefinition || "(none)"}\n\n` +
    `INCOMING (${incomingLabel}):\n${incomingDefinition || "(none)"}`;
  const [defText, setDefText] = useState(defSuggestion);

  const showNotePicker = !!(existingNote && incomingNote);
  const noteSuggestion = showNotePicker
    ? `EXISTING (${existingLabel}):\n${existingNote}\n\nINCOMING (${incomingLabel}):\n${incomingNote}`
    : "";
  const [noteText, setNoteText] = useState(noteSuggestion);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Combine definitions</h3>
        <p className="muted">
          You're merging <strong>"{incomingLabel}"</strong> into{" "}
          <strong>"{existingLabel}"</strong>. Pick or edit the combined
          definition{showNotePicker ? " and note" : ""}.
        </p>

        <div className="modal-choices">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDefText(existingDefinition)}
          >
            Keep existing
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDefText(incomingDefinition)}
          >
            Use incoming
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDefText(defSuggestion)}
          >
            Keep both (labeled)
          </button>
        </div>

        <textarea
          className="modal-textarea"
          value={defText}
          onChange={(e) => setDefText(e.target.value)}
          rows={10}
        />

        {showNotePicker && (
          <>
            <h4 className="modal-subtitle">Combine notes</h4>
            <div className="modal-choices">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setNoteText(existingNote!)}
              >
                Keep existing
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setNoteText(incomingNote!)}
              >
                Use incoming
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setNoteText(noteSuggestion)}
              >
                Keep both (labeled)
              </button>
            </div>
            <textarea
              className="modal-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={6}
            />
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel merge
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              onConfirm(defText, showNotePicker ? noteText : undefined)
            }
          >
            Confirm merge
          </button>
        </div>
      </div>
    </div>
  );
}
