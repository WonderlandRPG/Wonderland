import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
export const metadata={title:"História de Wonderland"};
export default function HistoryPage(){return <main className="lore-page"><PlayerNav/><div className="page-container world-lore-shell"><section className="history-reconstruction"><span>✦</span><small>ARQUIVO REAL EM REVISÃO</small><h1>A história está<br/>sendo reescrita.</h1><p>As crônicas antigas foram retiradas do site enquanto a nova história oficial de Wonderland é preparada. Nenhum texto anterior será exibido como cânone.</p><Link className="button button--primary" href="/reinos">Explorar os reinos atualizados</Link></section></div></main>}
