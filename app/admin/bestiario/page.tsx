import { parseCreatureCombatProfile } from "@/lib/game/creature-tactical-combat";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateCreatureCombatProfileAdminAction } from "./actions";

export const metadata = { title: "Bestiário | Painel ADM" };
export const dynamic = "force-dynamic";

const ranks = ["E", "D", "C", "B", "A", "S", "EX"];

function skillEffect(skill: ReturnType<typeof parseCreatureCombatProfile>["skills"][number]) {
  if (skill.operations.some((operation) => operation.operation === "ROOT")) return "root";
  if (skill.operations.some((operation) => operation.operation === "STUN")) return "stun";
  if (skill.operations.some((operation) => operation.operation === "PUSH")) return "push";
  return "none";
}

function effectDuration(skill: ReturnType<typeof parseCreatureCombatProfile>["skills"][number]) {
  return skill.operations.find((operation) => operation.operation === "ROOT" || operation.operation === "STUN")?.duration ?? 0;
}

function effectDistance(skill: ReturnType<typeof parseCreatureCombatProfile>["skills"][number]) {
  return skill.operations.find((operation) => operation.operation === "PUSH")?.distance ?? 0;
}

function damageBase(skill: ReturnType<typeof parseCreatureCombatProfile>["skills"][number]) {
  return skill.operations.find((operation) => operation.operation === "DAMAGE")?.base ?? 0;
}

export default async function AdminBestiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; busca?: string; rank?: string; pagina?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.pagina) || 1);
  const client = await createServerSupabaseClient();
  let creatureQuery = client?.from("v2_creatures").select("*", { count: "exact" });
  if (query.busca) creatureQuery = creatureQuery?.ilike("name", `%${query.busca}%`);
  if (query.rank && ranks.includes(query.rank)) creatureQuery = creatureQuery?.eq("rank", query.rank);
  const { data, count } = creatureQuery
    ? await creatureQuery
        .order("rank")
        .order("name")
        .range((page - 1) * 25, page * 25 - 1)
    : { data: [], count: 0 };

  return (
    <div className="admin-content admin-editor-page">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Combate tático</span>
          <h2>Bestiário</h2>
          <p>
            Edite os números usados pelo mapa tático sem alterar a lore da criatura. HP,
            atributos, movimento, IA, resistências e até três habilidades ficam centralizados aqui.
          </p>
        </div>
      </header>

      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo"
            ? "✓ Perfil de combate da criatura atualizado."
            : "! Revise os dados do perfil de combate."}
        </div>
      ) : null}

      <form className="admin-catalog-filter">
        <input name="busca" defaultValue={query.busca ?? ""} placeholder="Buscar criatura" />
        <select name="rank" defaultValue={query.rank ?? ""}>
          <option value="">Todos os Ranks</option>
          {ranks.map((rank) => (
            <option key={rank} value={rank}>Rank {rank}</option>
          ))}
        </select>
        <button className="button button--primary">Filtrar criaturas</button>
        <span>{count ?? 0} resultados</span>
      </form>

      <section className="admin-editor-list">
        {(data ?? []).map((creature) => {
          const row = creature as typeof creature & { combat_profile?: unknown };
          const profile = parseCreatureCombatProfile(row.rank, row.combat_profile);
          return (
            <details className="admin-editor-card" key={row.id}>
              <summary>
                <span>
                  <small>Rank {row.rank} · {row.category} · IA {profile.aiProfile}</small>
                  <strong>{row.name}</strong>
                  <small>HP {profile.hp} · Movimento {profile.movement} · {profile.skills.length} habilidade(s) própria(s)</small>
                </span>
                <b>{row.active ? "Ativa" : "Oculta"}</b>
              </summary>

              <form action={updateCreatureCombatProfileAdminAction} className="admin-form admin-item-form">
                <input type="hidden" name="id" value={row.id} />

                <fieldset>
                  <legend>Perfil tático</legend>
                  <label>
                    <span>HP</span>
                    <input name="hp" type="number" min="1" max="999999" defaultValue={profile.hp} required />
                  </label>
                  <label>
                    <span>Movimento por turno</span>
                    <input name="movement" type="number" min="0" max="20" defaultValue={profile.movement} required />
                  </label>
                  <label>
                    <span>Alcance do Ataque Básico</span>
                    <input name="basicAttackRange" type="number" min="1" max="20" defaultValue={profile.basicAttackRange} required />
                  </label>
                  <label>
                    <span>Tipo do Ataque Básico</span>
                    <select name="basicAttackDamageType" defaultValue={profile.basicAttackDamageType}>
                      <option value="physical">Físico</option>
                      <option value="magic">Mágico</option>
                    </select>
                  </label>
                  <label>
                    <span>Perfil da IA</span>
                    <select name="aiProfile" defaultValue={profile.aiProfile}>
                      <option value="aggressive">Agressiva</option>
                      <option value="ranged">Ranged</option>
                      <option value="controller">Controladora</option>
                    </select>
                  </label>
                  <label>
                    <span>Resistências</span>
                    <textarea
                      name="resistances"
                      rows={3}
                      defaultValue={profile.resistances.join(", ")}
                      placeholder="Ex.: fogo, veneno, medo"
                    />
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Atributos</legend>
                  {(["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const).map((attribute) => (
                    <label key={attribute}>
                      <span>{attribute}</span>
                      <input
                        name={attribute}
                        type="number"
                        min="0"
                        max="9999"
                        defaultValue={profile.attributes[attribute]}
                        required
                      />
                    </label>
                  ))}
                </fieldset>

                {[0, 1, 2].map((slot) => {
                  const skill = profile.skills[slot];
                  const index = slot + 1;
                  return (
                    <fieldset key={index}>
                      <legend>Habilidade {index}</legend>
                      <label>
                        <span>Nome</span>
                        <input name={`skill${index}Name`} defaultValue={skill?.name ?? ""} placeholder="Deixe vazio para não usar este slot" />
                      </label>
                      <label>
                        <span>Dano base</span>
                        <input name={`skill${index}Base`} type="number" min="0" max="99999" defaultValue={skill ? damageBase(skill) : 0} />
                      </label>
                      <label>
                        <span>Tipo de dano</span>
                        <select name={`skill${index}DamageType`} defaultValue={skill?.damageType === "true" ? "true" : skill?.damageType === "magic" ? "magic" : "physical"}>
                          <option value="physical">Físico</option>
                          <option value="magic">Mágico</option>
                          <option value="true">Verdadeiro</option>
                        </select>
                      </label>
                      <label>
                        <span>Alcance</span>
                        <input name={`skill${index}Range`} type="number" min="1" max="20" defaultValue={skill?.range ?? 1} />
                      </label>
                      <label>
                        <span>Cooldown</span>
                        <input name={`skill${index}Cooldown`} type="number" min="0" max="20" defaultValue={skill?.cooldown ?? 0} />
                      </label>
                      <label>
                        <span>Efeito secundário</span>
                        <select name={`skill${index}Effect`} defaultValue={skill ? skillEffect(skill) : "none"}>
                          <option value="none">Nenhum</option>
                          <option value="root">Root</option>
                          <option value="stun">Stun</option>
                          <option value="push">Push</option>
                        </select>
                      </label>
                      <label>
                        <span>Duração do controle</span>
                        <input name={`skill${index}Duration`} type="number" min="0" max="20" defaultValue={skill ? effectDuration(skill) : 0} />
                      </label>
                      <label>
                        <span>Distância do Push</span>
                        <input name={`skill${index}Distance`} type="number" min="0" max="20" defaultValue={skill ? effectDistance(skill) : 0} />
                      </label>
                    </fieldset>
                  );
                })}

                <small>
                  Fraquezas, descrição, comportamento e habitats continuam sendo os dados oficiais do Bestiário e não são alterados por este formulário.
                </small>
                <button className="button button--primary">Salvar perfil de combate</button>
              </form>
            </details>
          );
        })}
      </section>

      {(count ?? 0) > 25 ? (
        <nav className="admin-pagination">
          <a href={`/admin/bestiario?rank=${query.rank ?? ""}&busca=${query.busca ?? ""}&pagina=${Math.max(1, page - 1)}`}>← Anterior</a>
          <span>Página {page}</span>
          <a href={`/admin/bestiario?rank=${query.rank ?? ""}&busca=${query.busca ?? ""}&pagina=${page + 1}`}>Próxima →</a>
        </nav>
      ) : null}
    </div>
  );
}
