import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getServerOnline } from "@/lib/content/server-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Servidor em manutenção" };

export default async function MaintenancePage() {
  const [online, account] = await Promise.all([getServerOnline(), getCurrentAccount()]);
  if (online) redirect(account ? "/personagens" : "/entrar");
  if (account && isAdministrativeRole(account.role)) redirect("/admin");

  return (
    <main className="maintenance-page">
      <section>
        <div className="maintenance-page__mark">
          <span>W</span>
        </div>
        <span className="eyebrow">Portões temporariamente fechados</span>
        <h1>Wonderland está em manutenção.</h1>
        <p>
          A equipe está trabalhando nos sistemas do mundo. O acesso dos jogadores voltará assim que
          o servidor for ligado novamente.
        </p>
        <div className="maintenance-page__status">
          <span />
          <div>
            <small>Estado atual</small>
            <strong>Servidor desligado</strong>
          </div>
        </div>
        <Link href="/entrar">Acesso administrativo</Link>
      </section>
    </main>
  );
}
