import Link from "next/link";
import { redirect } from "next/navigation";

import { PlayerNav } from "@/components/player-nav";
import { TacticalLab } from "@/components/arena/tactical-lab";
import { isAdministrativeRole, requireCurrentAccount } from "@/lib/auth/account";

export const metadata = { title: "Laboratório do Mapa Tático" };
export const dynamic = "force-dynamic";

export default async function TacticalMapLabPage() {
  const account = await requireCurrentAccount("/arena/mapa-tatico");

  if (!isAdministrativeRole(account.role)) {
    redirect("/arena");
  }

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        <Link className="arena-mode-back" href="/arena">
          ← Voltar para Arena
        </Link>
        <TacticalLab />
      </div>
    </main>
  );
}
