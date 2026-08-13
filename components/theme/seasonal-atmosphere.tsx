"use client";

import { usePathname } from "next/navigation";

export function SeasonalAtmosphere() {
  const pathname = usePathname();
  return (
    <div className={`seasonal-atmosphere ${pathname.startsWith("/mapas") ? "is-map" : ""}`} aria-hidden="true">
      <div className="seasonal-atmosphere__snow">
        {Array.from({ length: 26 }, (_, index) => (
          <i key={index} style={{ "--flake": index } as React.CSSProperties}>❄</i>
        ))}
      </div>
      <div className="seasonal-atmosphere__santa">
        <span>✦</span><b>🎅</b><i>🛷</i><em>🦌</em><em>🦌</em>
      </div>
      <div className="seasonal-atmosphere__witch">
        <span>🦇</span><span>🦇</span><b>🧙‍♀️</b><i>🧹</i><span>🦇</span>
      </div>
    </div>
  );
}
