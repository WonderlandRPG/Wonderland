import { ClassEditor } from "@/components/admin/class-editor";
import { createEmptyClassPayload } from "@/lib/game/classes";

export const metadata = { title: "Criar Classe" };

export default function NewClassPage() {
  return (
    <div className="admin-content race-editor-page">
      <ClassEditor
        initialValue={{
          id: "",
          name: "",
          slug: "",
          status: "draft",
          revision: 0,
          payload: createEmptyClassPayload(),
        }}
      />
    </div>
  );
}
