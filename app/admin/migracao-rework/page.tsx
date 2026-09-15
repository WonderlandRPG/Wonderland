import styles from "./rework-migration.module.css";

import { getReworkRolloutState } from "@/lib/content/rework-rollout";
import { reworkRolloutModules } from "@/lib/game/rework-rollout";

export const metadata = { title: "Migração do Rework | Painel ADM" };
export const dynamic = "force-dynamic";

export default async function ReworkMigrationPage() {
  const state = await getReworkRolloutState();

  return (
    <div className="admin-content">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Implantação controlada</span>
          <h2>Migração do Rework</h2>
          <p>Preparação modular e reversível sobre a estrutura oficial de Wonderland.</p>
        </div>
      </header>

      <section className={styles.guardrail} data-wl-status="warning">
        <strong>Contas do Rework não fazem parte desta migração.</strong>
        <p>
          Autenticação, contas, personagens e progresso continuam vindo exclusivamente do banco
          oficial. Nenhuma rotina desta fundação lê ou importa usuários de outro projeto.
        </p>
      </section>

      <section className="admin-section">
        <header>
          <div>
            <span className="eyebrow">Ordem de liberação</span>
            <h3>Módulos preparados</h3>
          </div>
          <span className={styles.offlineCount}>Todos desligados por padrão</span>
        </header>

        <div className={styles.moduleGrid}>
          {reworkRolloutModules.map((module, index) => {
            const enabled = state[module.id];
            return (
              <article className={styles.moduleCard} data-wl-component="card" key={module.id}>
                <div className={styles.moduleHeading}>
                  <span className={styles.order}>{String(index + 1).padStart(2, "0")}</span>
                  <span data-wl-status={enabled ? "success" : "warning"}>
                    {enabled ? "Ativo" : "Desligado"}
                  </span>
                </div>
                <h4>{module.label}</h4>
                <p>{module.description}</p>
                <small>
                  {module.dependencies.length
                    ? `Depende de: ${module.dependencies.join(", ")}`
                    : "Módulo-base sem dependências."}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <header>
          <div>
            <span className="eyebrow">Proteções</span>
            <h3>Como será possível desfazer</h3>
          </div>
        </header>
        <ol className={styles.rollbackList}>
          <li>Desligar o módulo afetado sem alterar contas ou progresso.</li>
          <li>Reverter o deploy para a versão estável anterior na Vercel.</li>
          <li>Executar o rollback SQL, que remove somente as sete chaves de liberação criadas.</li>
        </ol>
      </section>
    </div>
  );
}
