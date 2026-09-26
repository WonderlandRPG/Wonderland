import Link from "next/link";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reworkRolloutModules } from "@/lib/game/rework-rollout";

export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string };

export default async function ReleaseReadinessPage() {
  await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  const checks: Check[] = [];
  checks.push({
    label: "Aplicação conectada",
    ok: Boolean(client),
    detail: client ? "Supabase disponível" : "Cliente indisponível",
  });
  if (client) {
    const [settings, season, pve, pvp] = await Promise.all([
      client
        .from("v2_game_settings")
        .select("key,value")
        .in(
          "key",
          reworkRolloutModules.map((module) => module.settingKey),
        ),
      client
        .from("v2_ranked_seasons")
        .select("id,name,ends_at")
        .eq("status", "active")
        .maybeSingle(),
      client
        .from("v2_arena_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      client
        .from("v2_pvp_matches")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "awaiting_acceptance"]),
    ]);
    const enabled = new Set(
      (settings.data ?? []).filter((entry) => entry.value === true).map((entry) => entry.key),
    );
    checks.push({
      label: "Módulos do Rework",
      ok: enabled.size === reworkRolloutModules.length,
      detail: `${enabled.size}/${reworkRolloutModules.length} módulos ativos`,
    });
    const activeSeason = season.data as { name: string } | null;
    checks.push({
      label: "Temporada ranqueada",
      ok: Boolean(activeSeason),
      detail: activeSeason ? `${activeSeason.name} ativa` : "Nenhuma temporada ativa",
    });
    checks.push({
      label: "Sessões PvE íntegras",
      ok: !pve.error,
      detail: pve.error?.message ?? `${pve.count ?? 0} combate(s) em andamento`,
    });
    checks.push({
      label: "Salas PvP íntegras",
      ok: !pvp.error,
      detail: pvp.error?.message ?? `${pvp.count ?? 0} sala(s) em andamento`,
    });
  }
  const ready = checks.every((check) => check.ok);
  return (
    <div className="admin-content">
      <section className="admin-page-title">
        <span className="eyebrow">URL separada para administradores</span>
        <h2>Homologação e publicação</h2>
        <p>Verificação objetiva antes de promover uma versão ao domínio oficial.</p>
      </section>
      <section className="admin-section">
        <div className="history-list">
          {checks.map((check) => (
            <article key={check.label}>
              <span>{check.ok ? "✓" : "!"}</span>
              <div>
                <strong>{check.label}</strong>
                <small>{check.detail}</small>
              </div>
              <b>{check.ok ? "APROVADO" : "ATENÇÃO"}</b>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-section">
        <h3>{ready ? "Pronto para publicação gradual" : "Publicação bloqueada"}</h3>
        <p>
          {ready
            ? "Use a prévia da Vercel, execute uma partida PvE e uma PvP, e então promova a versão."
            : "Resolva os itens destacados antes de promover qualquer versão."}
        </p>
        <div className="admin-actions">
          <Link className="button button--primary" href="/arena">
            Testar Arena
          </Link>
          <Link className="button button--ghost" href="/admin/migracao-rework">
            Rollout e rollback
          </Link>
        </div>
      </section>
    </div>
  );
}
