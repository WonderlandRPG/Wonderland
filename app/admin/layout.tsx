import "./admin.css";
import "./admin-shell-fix.css";
import "./admin-experience.css";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await requireAdministrativeAccount();
  const configured = Boolean(await createServerSupabaseClient());

  return (
    <main className="admin-shell">
      <AdminSidebar account={account} />
      <section className="admin-workspace">
        <AdminTopbar account={account} configured={configured} />
        {children}
      </section>
    </main>
  );
}
