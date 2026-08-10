import { PlayerNav } from "@/components/player-nav";
import { WorldMap } from "@/components/world/world-map";
import { worldHistory } from "@/lib/game/world-lore";
export const metadata={title:"História de Wonderland"};
export default function HistoryPage(){return <main className="lore-page"><PlayerNav/><div className="page-container world-lore-shell"><header className="world-lore-hero"><span className="eyebrow">Crônicas oficiais</span><h1>A História de Wonderland</h1><p>Guerras, sacrifícios e reinos perdidos moldaram o mundo que a nova geração de aventureiros encontrou.</p></header><WorldMap/><section className="world-timeline">{worldHistory.map((entry,index)=><article key={entry.title}><span>{String(index+1).padStart(2,"0")}</span><div><small>{entry.era}</small><h2>{entry.title}</h2><p>{entry.text}</p></div></article>)}</section></div></main>}
