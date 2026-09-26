"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().trim().min(3).max(80),
  startsAt: z.string().min(16),
  endsAt: z.string().min(16),
  activate: z.boolean(),
});
const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["scheduled", "active", "finished"]),
});

export async function createRankedSeasonAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    activate: formData.get("activate") === "on",
  });
  if (!parsed.success) redirect("/admin/temporadas?status=erro");
  const client = await createServerSupabaseClient();
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (
    !Number.isFinite(startsAt.getTime()) ||
    !Number.isFinite(endsAt.getTime()) ||
    endsAt <= startsAt
  )
    redirect("/admin/temporadas?status=erro");
  const { error } = client
    ? await client.rpc(
        "v2_admin_manage_ranked_season" as never,
        {
          p_name: parsed.data.name,
          p_starts_at: startsAt.toISOString(),
          p_ends_at: endsAt.toISOString(),
          p_activate: parsed.data.activate,
        } as never,
      )
    : { error: { message: "Banco indisponível" } };
  revalidatePath("/admin/temporadas");
  redirect(
    error
      ? `/admin/temporadas?status=erro&mensagem=${encodeURIComponent(error.message)}`
      : "/admin/temporadas?status=salvo",
  );
}

export async function setRankedSeasonStatusAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) redirect("/admin/temporadas?status=erro");
  const client = await createServerSupabaseClient();
  const { error } = client
    ? await client.rpc(
        "v2_admin_set_ranked_season_status" as never,
        { p_season_id: parsed.data.id, p_status: parsed.data.status } as never,
      )
    : { error: { message: "Banco indisponível" } };
  revalidatePath("/admin/temporadas");
  redirect(
    error
      ? `/admin/temporadas?status=erro&mensagem=${encodeURIComponent(error.message)}`
      : "/admin/temporadas?status=salvo",
  );
}
