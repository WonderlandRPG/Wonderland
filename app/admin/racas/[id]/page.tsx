import { RaceEditor } from "@/components/admin/race-editor";
import { RaceHistory } from "@/components/admin/race-history";
import { getRaceHistory, requireRaceById } from "@/lib/content/races";

export const metadata = {
  title: "Editar Raça",
};

export const dynamic = "force-dynamic";

export default async function EditRacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [race, history] = await Promise.all([requireRaceById(id), getRaceHistory(id)]);

  return (
    <div className="admin-content race-editor-page">
      <div className="race-editor-layout">
        <RaceEditor
          initialValue={{
            id: race.id,
            name: race.name,
            slug: race.slug,
            status: race.status,
            revision: race.revision,
            payload: race.payload,
          }}
          notice={query.status}
        />
        <RaceHistory
          currentRevision={race.revision}
          revisions={history}
          updatedAt={race.updated_at}
        />
      </div>
    </div>
  );
}
