import { redirect } from "next/navigation";

export default function LegacyAdminCosmeticsPage() {
  redirect("/loja?tab=cosmeticos");
}
