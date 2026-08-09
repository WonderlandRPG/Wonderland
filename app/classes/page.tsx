import { PlayerNav } from "@/components/player-nav";
import { ClassCodex } from "@/components/codex/class-codex";
import { getClassCatalog } from "@/lib/content/classes";
export const metadata = { title: "Classes de Wonderland" };
export const dynamic = "force-dynamic";
export default async function ClassesPage() { const classes = await getClassCatalog({ publishedOnly:true }); return <main className="lore-page"><PlayerNav/><div className="page-container lore-page__inner"><header className="lore-hero"><span className="eyebrow">Biblioteca dos aventureiros</span><h1>Classes</h1><p>Compare funções, recursos, Caminhos e habilidades antes de criar seu personagem.</p></header><ClassCodex entries={classes}/></div></main>; }
