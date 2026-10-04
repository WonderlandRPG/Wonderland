import { redirect } from "next/navigation";

export default function LegacyImporterRedirect() {
  redirect("/admin/migracao-rework");
}
