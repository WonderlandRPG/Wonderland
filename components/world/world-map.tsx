import Link from "next/link";
import { realmLore } from "@/lib/game/world-lore";

export function WorldMap({ linkToRealms = true }: { linkToRealms?: boolean }) {
  return <section className="world-map world-map--atlas" aria-label="Mapa dos seis reinos de Wonderland">
    <div className="world-map__title"><small>CARTOGRAFIA REAL · EDIÇÃO ATUAL</small><strong>Wonderland</strong></div>
    <svg className="world-map__chart" viewBox="0 0 1000 520" role="img" aria-label="Territórios, mares e rotas de Wonderland">
      <defs><filter id="map-shadow"><feDropShadow dx="0" dy="10" stdDeviation="9" floodOpacity=".5"/></filter><pattern id="map-waves" width="34" height="18" patternUnits="userSpaceOnUse"><path d="M0 9 Q8 1 17 9 T34 9" fill="none" stroke="currentColor" strokeOpacity=".11"/></pattern><linearGradient id="west-land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#436c4e"/><stop offset="1" stopColor="#172d24"/></linearGradient><linearGradient id="east-land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7d6738"/><stop offset="1" stopColor="#2d3927"/></linearGradient></defs>
      <rect width="1000" height="520" className="world-map__water"/><rect width="1000" height="520" fill="url(#map-waves)" className="world-map__waves"/>
      <path d="M72 110 L205 57 340 80 442 159 407 233 455 294 389 407 242 452 96 374 119 280 45 210Z" fill="url(#west-land)" className="world-map__continent" filter="url(#map-shadow)"/>
      <path d="M570 72 L753 50 912 130 867 218 955 309 877 430 719 462 580 385 608 281 528 203Z" fill="url(#east-land)" className="world-map__continent" filter="url(#map-shadow)"/>
      <path d="M130 333 Q315 224 469 391 T839 174" className="world-map__route"/><path d="M212 104 Q442 148 692 89" className="world-map__route world-map__route--rainbow"/>
      <ellipse cx="470" cy="412" rx="118" ry="64" className="world-map__namida-dome"/>
      <text x="445" y="275" className="world-map__sea-label">MAR DOS ESPELHOS</text><text x="107" y="432" className="world-map__terrain-label">RAÍZES ANCESTRAIS</text><text x="733" y="430" className="world-map__terrain-label">ROTAS DE LESEDI</text>
    </svg>
    {realmLore.map((realm,index) => { const marker=<><b>{realm.icon}</b><span>{realm.name}</span><small>{realm.title}</small></>; const style={left:`${realm.position[0]}%`,top:`${realm.position[1]}%`,"--realm":realm.color} as React.CSSProperties; return linkToRealms?<Link className="world-map__realm" href={`/reinos#${realm.key}`} key={realm.key} style={style} aria-label={`${index+1}. ${realm.name}: ${realm.title}`}>{marker}</Link>:<a className="world-map__realm" href={`#${realm.key}`} key={realm.key} style={style} aria-label={`${index+1}. ${realm.name}: ${realm.title}`}>{marker}</a>; })}
    <div className="world-map__legend"><span><i/> Reino</span><span><i/> Rota marítima</span><span><i/> Ponte de Arco-Íris</span></div><div className="world-map__compass"><b>N</b><i/><span>O</span><span>L</span><small>S</small></div>
  </section>;
}
