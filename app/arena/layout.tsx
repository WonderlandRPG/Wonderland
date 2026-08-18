import { ArenaImageRepair } from "@/components/arena/arena-image-repair";

import "./arena.css";
import "./arena-images.css";
import "./jrpg.css";
import "./combat-polish.css";

export default function ArenaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ArenaImageRepair />
      {children}
    </>
  );
}
