import { AdminCreationStudio } from "@/components/admin/admin-creation-studio";
import { SimpleSkillLibrary } from "@/components/admin/simple-skill-library";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseClassPayload } from "@/lib/game/classes";
import { simpleDraftFromClassSkill } from "@/lib/admin/simple-skill-reader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio de Criação" };

export default async function AdminCreationStudioPage() {
  const client = await createServerSupabaseClient();
  const { data } = client
    ? await client.from("v2_content").select("id,name,status,payload").eq("content_type", "class").neq("status", "archived").order("name")
    : { data: [] };
  const classes = (data ?? []).map((item) => {
    const parsed = parseClassPayload(item.payload);
    return {
      id: item.id,
      name: item.name,
      status: item.status,
      skills: parsed.success ? parsed.data.progression.map((skill) => ({ key: skill.key, name: skill.name, level: skill.level, draft: simpleDraftFromClassSkill(skill) })) : [],
    };
  });

  return (
    <div className="admin-content">
      <AdminCreationStudio
        aiConfigured={Boolean(process.env.OPENAI_API_KEY)}
        classes={classes.map(({ id, name, status }) => ({ id, name, status }))}
      />
      <SimpleSkillLibrary classes={classes} />
    </div>
  );
}
