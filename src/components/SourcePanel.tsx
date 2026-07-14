import { useRef, useState } from "react";
import { parseSpreadsheet } from "../parsing/parseSpreadsheet";
import { useSources } from "../state/SourceContext";
import type { Side } from "../types";
import { SourceTreeView } from "./SourceTree";

interface Props {
  side: Side;
}

export function SourcePanel({ side }: Props) {
  const { left, right, setSide } = useSources();
  const tree = side === "LEFT" ? left : right;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const parsed = await parseSpreadsheet(file);
      setSide(side, parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onClear() {
    setSide(side, null);
    setError(null);
  }

  return (
    <div className="source-panel">
      <header className="panel-header">
        <div className="panel-title">
          <span className={`side-tag side-${side.toLowerCase()}`}>{side}</span>
          <span className="panel-heading">Code System</span>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn"
            onClick={() => inputRef.current?.click()}
          >
            {tree ? "Replace file" : "Upload file"}
          </button>
          {tree && (
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Clear
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onPick}
            style={{ display: "none" }}
          />
        </div>
      </header>

      {tree && (
        <div className="file-meta">
          <span>{tree.fileName}</span>
          <span className="dot">·</span>
          <span>{tree.roots.length} top-level</span>
        </div>
      )}

      {loading && <div className="notice">Parsing…</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <div className="panel-body">
        {tree ? (
          <SourceTreeView tree={tree} side={side} />
        ) : (
          <div className="empty">
            Upload a .xlsx or .csv with columns:
            <ol>
              <li>Top-level code</li>
              <li>Sub-code</li>
              <li>Code</li>
              <li>Definition</li>
            </ol>
            First row is treated as headers.
          </div>
        )}
      </div>
    </div>
  );
}
