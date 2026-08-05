import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sessão administrativa ausente.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Variáveis do Supabase não configuradas na função.");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) throw new Error("Sessão inválida.");

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "admin") throw new Error("Apenas administradores podem validar contas.");

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id || "").trim();
    if (!userId) throw new Error("ID do usuário não informado.");

    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (error) throw error;

    await adminClient.from("admin_audit_log").insert({
      admin_id: authData.user.id,
      action: "confirm_user_email",
      target_type: "auth_user",
      target_id: userId,
      metadata: { email: data.user?.email || null },
    }).then(() => undefined).catch(() => undefined);

    return new Response(JSON.stringify({
      success: true,
      user_id: data.user?.id,
      email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível validar a conta.",
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
