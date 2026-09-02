import type { ReactNode } from "react";

import "./tactical-v2.css";
import "./tactical-scenes.css";

export default function TacticalMapLayout({ children }: { children: ReactNode }) {
  return <div className="tactical-route-v2">{children}</div>;
}
