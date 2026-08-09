import Link from "next/link";

import { ClassPreview } from "@/components/admin/class-preview";
import { requireClassById } from "@/lib/content/classes";

export const metadata = { title: "Prévia da Classe" };
export const dynamic = "force-dynamic";

export default async function SavedClassPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await requireClassById(id);
  return (
    <div className="admin-content race-saved-preview-page">
      <header className="race-saved-preview-header">
        <div>
          <Link className="race-back-link" href={`/admin/classes/${entry.id}`}>
            ← Voltar ao editor
          </Link>
          <h1>Prévia salva</h1>
          <p>Revisão {entry.revision} · dados gravados no banco.</p>
        </div>
        <Link className="button button--primary" href={`/admin/classes/${entry.id}`}>
          Editar classe
        </Link>
      </header>
      <ClassPreview name={entry.name} payload={entry.payload} />
    </div>
  );
}
