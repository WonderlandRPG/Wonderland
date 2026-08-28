import { ArenaEntryNavigation } from "@/components/arena/arena-entry-navigation";
import { ArenaImageRepair } from "@/components/arena/arena-image-repair";
import { BattleFormationEnhancer } from "@/components/arena/battle-formation-enhancer";
import { CombatVisualEnhancer } from "@/components/arena/combat-visual-enhancer";

import "./arena.css";
import "./arena-images.css";
import "./combat-result-modal.css";
import "./jrpg.css";
import "./combat-polish.css";
import "./jrpg-formation.css";
import "./arena-depth.css";
import "./entry-hotfix.css";
import "./combat-immersion.css";
import "./combat-clarity.css";
import "./pvp-party.css";
import "./arena-rework.css";

export default function ArenaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ArenaEntryNavigation />
      <ArenaImageRepair />
      <BattleFormationEnhancer />
      <CombatVisualEnhancer />
      {children}
    </>
  );
}
