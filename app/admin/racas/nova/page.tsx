import { RaceEditor } from "@/components/admin/race-editor";
import { createEmptyRacePayload } from "@/lib/game/races";

export const metadata = {
  title: "Criar Raça",
};

export default function NewRacePage() {
  return (
    <div className="admin-content race-editor-page">
      <RaceEditor
        initialValue={{
          id: "",
          name: "",
          slug: "",
          status: "draft",
          revision: 0,
          payload: createEmptyRacePayload(),
        }}
      />
    </div>
  );
}
