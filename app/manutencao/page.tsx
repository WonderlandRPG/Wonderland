import Link from "next/link";
import { redirect } from "next/navigation";

import { UpdateBlocks } from "@/components/updates/update-blocks";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getServerOnline } from "@/lib/content/server-status";
import { getRecentPortalUpdates } from "@/lib/game/player-portal";

import styles from "./maintenance.module.css";
import contrast from "./maintenance-contrast.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Servidor em manutenção" };

export default async function MaintenancePage() {
  const [online, account, updates] = await Promise.all([
    getServerOnline(),
    getCurrentAccount(),
    getRecentPortalUpdates(1),
  ]);
  if (online) redirect(account ? "/personagens" : "/entrar");
  if (account && isAdministrativeRole(account.role)) redirect("/admin");

  const latestUpdate = updates[0];
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <main className="maintenance-page">
      <section className={`${styles.shell} ${contrast.shell}`}>
        <div className="maintenance-page__mark">
          <span>W</span>
        </div>
        <span className="eyebrow">Portões temporariamente fechados</span>
        <h1>Wonderland está em manutenção.</h1>
        <p>
          A equipe está trabalhando nos sistemas do mundo. Enquanto isso, você pode conferir abaixo
          a atualização mais recente completa.
        </p>
        <div className="maintenance-page__status">
          <span />
          <div>
            <small>Estado atual</small>
            <strong>Servidor desligado</strong>
          </div>
        </div>

        {latestUpdate ? (
          <article className={styles.latest}>
            <header className={styles.latestHeader}>
              <div>
                <small>Última atualização lançada</small>
                <h2>{latestUpdate.title}</h2>
              </div>
              <time>{date.format(new Date(`${latestUpdate.published_on}T00:00:00Z`))}</time>
            </header>
            <span className={styles.version}>VERSÃO {latestUpdate.version}</span>
            <div className="royal-chronicle__story">
              <UpdateBlocks blocks={latestUpdate.notes} />
            </div>
          </article>
        ) : (
          <p className={styles.empty}>Nenhuma atualização foi publicada até o momento.</p>
        )}

        <Link className={styles.adminLink} href="/entrar">
          Acesso administrativo
        </Link>
      </section>
    </main>
  );
}
