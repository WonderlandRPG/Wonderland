import { ArenaImageRepair } from "@/components/arena/arena-image-repair";
import { BattleFormationEnhancer } from "@/components/arena/battle-formation-enhancer";

import "./arena.css";
import "./arena-images.css";
import "./jrpg.css";
import "./combat-polish.css";
import "./jrpg-formation.css";
import "./arena-depth.css";

export default function ArenaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ArenaImageRepair />
      <BattleFormationEnhancer />
      {children}
    </>
  );
}
