import { redirect } from "next/navigation";

export default function LegacyCatalogRedirect() {
  redirect("/admin/migracao-rework");
}
