import { ArenaImageRepair } from "@/components/arena/arena-image-repair";

import "./arena.css";
import "./arena-images.css";

export default function ArenaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ArenaImageRepair />
      {children}
    </>
  );
}
