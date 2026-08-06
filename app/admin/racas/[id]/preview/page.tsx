import Link from "next/link";

import { RacePreview } from "@/components/admin/race-preview";
import { requireRaceById } from "@/lib/content/races";

export const metadata = {
  title: "Prévia da Raça",
};

export const dynamic = "force-dynamic";

export default async function RacePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const race = await requireRaceById(id);

  return (
    <div className="admin-content race-saved-preview-page">
      <header className="race-saved-preview-header">
        <div>
          <Link className="race-back-link" href={`/admin/racas/${race.id}`}>
            ← Voltar ao editor
          </Link>
          <h1>Prévia salva</h1>
          <p>Revisão {race.revision} · Esta tela mostra os dados já gravados no banco.</p>
        </div>
        <Link className="button button--primary" href={`/admin/racas/${race.id}`}>
          Editar raça
        </Link>
      </header>
      <RacePreview name={race.name} payload={race.payload} />
    </div>
  );
}
