import type { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface Props {
  left: ReactNode;
  middle: ReactNode;
  right: ReactNode;
}

export function SplitLayout({ left, middle, right }: Props) {
  return (
    <PanelGroup direction="horizontal" className="split-root">
      <Panel defaultSize={30} minSize={15} className="split-panel panel-left">
        {left}
      </Panel>
      <PanelResizeHandle className="split-handle" />
      <Panel defaultSize={40} minSize={20} className="split-panel panel-middle">
        {middle}
      </Panel>
      <PanelResizeHandle className="split-handle" />
      <Panel defaultSize={30} minSize={15} className="split-panel panel-right">
        {right}
      </Panel>
    </PanelGroup>
  );
}
