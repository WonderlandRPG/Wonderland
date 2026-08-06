import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return Response.json(
      {
        status: "degraded",
        application: "wonderland-v2",
        supabase: "pending",
      },
      { status: 503 },
    );
  }

  const { error } = await supabase
    .from("v2_game_settings")
    .select("key", { count: "exact", head: true });

  if (error) {
    return Response.json(
      {
        status: "degraded",
        application: "wonderland-v2",
        supabase: "unavailable",
      },
      { status: 503 },
    );
  }

  return Response.json({
    status: "ok",
    application: "wonderland-v2",
    supabase: "connected",
  });
}
