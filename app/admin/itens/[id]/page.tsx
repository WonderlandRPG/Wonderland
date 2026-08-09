import { ItemEditor } from "@/components/admin/item-editor";
import { requireItemById } from "@/lib/content/items";

export const metadata = { title: "Editar Item" };
export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const item = await requireItemById(id);
  return (
    <div className="admin-content race-editor-page">
      <ItemEditor
        initialValue={{
          id: item.id,
          name: item.name,
          slug: item.slug,
          status: item.status,
          revision: item.revision,
          payload: item.payload,
        }}
        notice={query.status}
      />
    </div>
  );
}
