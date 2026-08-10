import Link from "next/link";
import { realmLore } from "@/lib/game/world-lore";

export function WorldMap({ linkToRealms = true }: { linkToRealms?: boolean }) {
  return <section className="world-map" aria-label="Mapa dos cinco reinos de Wonderland">
    <div className="world-map__ocean"><span>MAR DOS ESPELHOS</span></div>
    <div className="world-map__land world-map__land--west"/><div className="world-map__land world-map__land--east"/>
    <div className="world-map__routes" aria-hidden="true"><i/><i/><i/><i/></div>
    {realmLore.map((realm,index) => linkToRealms ? <Link className="world-map__realm" href={`/reinos#${realm.key}`} key={realm.key} style={{ left:`${realm.position[0]}%`,top:`${realm.position[1]}%`,"--realm":realm.color } as React.CSSProperties}><b>{String(index+1).padStart(2,"0")}</b><span>{realm.name}</span><small>{realm.title}</small></Link> : <a className="world-map__realm" href={`#${realm.key}`} key={realm.key} style={{ left:`${realm.position[0]}%`,top:`${realm.position[1]}%`,"--realm":realm.color } as React.CSSProperties}><b>{String(index+1).padStart(2,"0")}</b><span>{realm.name}</span><small>{realm.title}</small></a>)}
    <div className="world-map__compass"><b>N</b><i/><span>W</span><span>E</span><small>S</small></div>
  </section>;
}
