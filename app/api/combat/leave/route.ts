import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  kind: z.enum(["arena", "pvp", "dungeon"]),
  combatId: z.uuid(),
});

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ ok: false }, { status: 503 });
  const { error } = await client.rpc("v2_leave_combat_screen", {
    p_kind: parsed.data.kind,
    p_combat_id: parsed.data.combatId,
  });
  return NextResponse.json({ ok: !error }, { status: error ? 403 : 200 });
}
