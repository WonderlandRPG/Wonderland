import { ClassEditor } from "@/components/admin/class-editor";
import { ClassHistory } from "@/components/admin/class-history";
import { getClassHistory, requireClassById } from "@/lib/content/classes";

export const metadata = { title: "Editar Classe" };
export const dynamic = "force-dynamic";

export default async function EditClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [entry, history] = await Promise.all([requireClassById(id), getClassHistory(id)]);
  return (
    <div className="admin-content race-editor-page">
      <div className="race-editor-layout">
        <ClassEditor
          initialValue={{
            id: entry.id,
            name: entry.name,
            slug: entry.slug,
            status: entry.status,
            revision: entry.revision,
            payload: entry.payload,
          }}
          notice={query.status}
        />
        <ClassHistory
          currentRevision={entry.revision}
          revisions={history}
          updatedAt={entry.updated_at}
        />
      </div>
    </div>
  );
}
