import { ClassEditor } from "@/components/admin/class-editor";
import { requireClassById } from "@/lib/content/classes";
export const dynamic = "force-dynamic";
export const metadata = { title: "Editar Classe" };
export default async function EditClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const item = await requireClassById(id);
  return (
    <div className="admin-content race-editor-page">
      <ClassEditor
        initialValue={{
          id: item.id,
          name: item.name,
          slug: item.slug,
          revision: item.revision,
          status: item.status,
          payload: item.payload,
        }}
        notice={query.status}
      />
    </div>
  );
}
