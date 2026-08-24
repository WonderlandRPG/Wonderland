import Link from "next/link";
import { realmLore } from "@/lib/game/world-lore";

const territoryShapes: Record<string, string> = {
  oymyakon: "polygon(2% 0, 49% 0, 48% 36%, 36% 39%, 24% 34%, 4% 38%)",
  darkya: "polygon(0 31%, 43% 29%, 52% 43%, 45% 62%, 30% 65%, 0 59%)",
  aokigahara: "polygon(0 55%, 33% 47%, 52% 62%, 47% 100%, 0 100%)",
  skypiece: "polygon(48% 0, 100% 0, 100% 40%, 71% 40%, 56% 35%, 45% 23%)",
  lesedi: "polygon(51% 39%, 100% 36%, 100% 100%, 62% 100%, 57% 73%, 45% 58%)",
  namida: "ellipse(17% 22% at 52% 78%)",
};

const tooltipPositions: Record<string, readonly [number, number]> = {
  oymyakon: [25, 27],
  darkya: [28, 39],
  aokigahara: [25, 48],
  skypiece: [70, 32],
  lesedi: [74, 50],
  namida: [52, 48],
};

// Coordenadas ancoradas nos marcos visuais da pintura, não no centro geométrico
// dos polígonos: capital congelada, Cidade Ferrugem, Árvore Imponente,
// cidadela celeste, Estrela de Mana e cidade sob a redoma.
const mapPinPositions: Record<string, readonly [number, number]> = {
  oymyakon: [27, 25],
  darkya: [22, 47],
  aokigahara: [30, 65],
  skypiece: [73, 18],
  lesedi: [85, 40],
  namida: [52, 78],
};

export function WorldMap({ linkToRealms = true }: { linkToRealms?: boolean }) {
  return <section className="world-map world-map--illustrated" aria-label="Mapa interativo dos seis reinos de Wonderland">
    <div className="world-map__title"><small>CARTOGRAFIA REAL · PASSE O MOUSE</small><strong>Wonderland</strong></div><div className="world-map__painting" aria-hidden="true"/>
    <div className="world-map__territories">
      {realmLore.map((realm)=>{const position=mapPinPositions[realm.key] ?? realm.position;const style={"--realm":realm.color,"--territory":territoryShapes[realm.key],"--pin-x":`${position[0]}%`,"--pin-y":`${position[1]}%`} as React.CSSProperties;const pin=<span className="world-map__pin"><b>{realm.icon}</b></span>;return linkToRealms?<Link className={`world-map__territory is-${realm.key}`} href={`/reinos#${realm.key}`} key={realm.key} style={style} aria-label={`Explorar ${realm.name}`}>{pin}</Link>:<a className={`world-map__territory is-${realm.key}`} href={`#${realm.key}`} key={realm.key} style={style} aria-label={`Ver imagens e informações de ${realm.name}`}>{pin}</a>;})}
      {realmLore.map((realm)=>{const position=tooltipPositions[realm.key];const style={"--realm":realm.color,"--tooltip-x":`${position[0]}%`,"--tooltip-y":`${position[1]}%`} as React.CSSProperties;return <span className={`world-map__tooltip is-${realm.key}`} key={`tooltip-${realm.key}`} style={style}><small>{realm.title}</small><strong>{realm.name}</strong><em>{realm.summary}</em><b>Explorar reino →</b></span>;})}
    </div>
    <div className="world-map__legend"><span><i/> Passe o mouse para iluminar</span><span><i/> Clique para abrir o dossiê</span></div><div className="world-map__compass"><b>N</b><i/><span>O</span><span>L</span><small>S</small></div>
  </section>;
}
