import { roleLabels, requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updatePlayerRole } from "./actions";
export const dynamic = "force-dynamic";
export default async function PlayersAdmin() {
  await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  const { data: profiles } = client
    ? await client
        .from("v2_profiles")
        .select("user_id,display_name,created_at")
        .order("created_at", { ascending: false })
    : { data: [] };
  const ids = (profiles ?? []).map((p) => p.user_id);
  const { data: roles } =
    client && ids.length
      ? await client.from("v2_user_roles").select("user_id,role").in("user_id", ids)
      : { data: [] };
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
  return (
    <div className="admin-content">
      <section className="admin-page-title">
        <span className="eyebrow">Comunidade</span>
        <h2>Jogadores e cargos</h2>
        <p>Gerencie com segurança as permissões de cada membro.</p>
      </section>
      <section className="admin-section">
        <div className="admin-table">
          {profiles?.length ? (
            profiles.map((profile) => {
              const role = roleMap.get(profile.user_id) ?? "player";
              return (
                <article key={profile.user_id}>
                  <div className="portal-avatar">
                    {(profile.display_name || "J").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{profile.display_name || "Jogador"}</strong>
                    <small>
                      Membro desde {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </small>
                  </div>
                  <form action={updatePlayerRole}>
                    <input type="hidden" name="userId" value={profile.user_id} />
                    <select name="role" defaultValue={role}>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button className="button button--primary button--small">Salvar</button>
                  </form>
                </article>
              );
            })
          ) : (
            <p>Nenhum jogador encontrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
