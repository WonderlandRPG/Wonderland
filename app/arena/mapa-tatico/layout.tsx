import type { ReactNode } from "react";

import "./tactical-reference.css";

export default function TacticalMapLayout({ children }: { children: ReactNode }) {
  return <div className="tactical-route-v2">{children}</div>;
}
