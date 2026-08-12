import type { OriginRef } from "../types";

interface Props {
  origins: OriginRef[];
}

export function OriginBadge({ origins }: Props) {
  const hasLeft = origins.some((o) => o.side === "LEFT");
  const hasRight = origins.some((o) => o.side === "RIGHT");
  let text = "";
  let cls = "";
  if (hasLeft && hasRight) {
    text = "L+R";
    cls = "badge badge-merged";
  } else if (hasLeft) {
    text = "L";
    cls = "badge badge-left";
  } else if (hasRight) {
    text = "R";
    cls = "badge badge-right";
  } else {
    text = "?";
    cls = "badge";
  }
  return <span className={cls}>{text}</span>;
}
