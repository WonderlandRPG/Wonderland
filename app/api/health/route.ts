import { isSupabaseConfigured } from "@/lib/config/env";

export function GET() {
  return Response.json({
    status: "ok",
    application: "wonderland-v2",
    supabase: isSupabaseConfigured() ? "configured" : "pending",
  });
}
