import { PlayerNav } from "@/components/player-nav";
import { WorldMap } from "@/components/world/world-map";
import { requireActiveCharacter } from "@/lib/content/active-character";
export const metadata={title:"Mapa de Wonderland"};
export default async function MapsPage(){await requireActiveCharacter("/mapas");return <main className="lore-page"><PlayerNav/><div className="page-container world-lore-shell"><header className="world-lore-hero"><span className="eyebrow">Cartografia da Arena</span><h1>Mapa de Wonderland</h1><p>Selecione um território para abrir seu arquivo completo no Atlas dos Reinos.</p></header><WorldMap/></div></main>}
