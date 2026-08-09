import { ItemEditor } from "@/components/admin/item-editor";
import { createEmptyItemPayload } from "@/lib/game/items";

export const metadata = { title: "Criar Item" };
export default function NewItemPage() {
  return (
    <div className="admin-content race-editor-page">
      <ItemEditor
        initialValue={{
          id: "",
          name: "",
          slug: "",
          status: "draft",
          revision: 0,
          payload: createEmptyItemPayload(),
        }}
      />
    </div>
  );
}
