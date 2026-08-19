import { AdminCreationStudio } from "@/components/admin/admin-creation-studio";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio de Criação" };

export default async function AdminCreationStudioPage() {
  const client = await createServerSupabaseClient();
  const { data } = client
    ? await client.from("v2_content").select("id,name,status").eq("content_type", "class").neq("status", "archived").order("name")
    : { data: [] };

  return (
    <div className="admin-content">
      <AdminCreationStudio
        aiConfigured={Boolean(process.env.OPENAI_API_KEY)}
        classes={(data ?? []).map((item) => ({ id: item.id, name: item.name, status: item.status }))}
      />
    </div>
  );
}
