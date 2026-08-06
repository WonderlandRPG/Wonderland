import "server-only";

import { contentCatalog, type ContentType } from "@/lib/game/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ContentModuleOverview {
  key: ContentType;
  label: string;
  description: string;
  glyph: string;
  drafts: number;
  published: number;
}

export interface AdminOverview {
  configured: boolean;
  modules: ContentModuleOverview[];
  totals: {
    drafts: number;
    published: number;
    modules: number;
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const client = await createServerSupabaseClient();
  const counts = new Map<ContentType, { drafts: number; published: number }>();

  if (client) {
    const { data } = await client
      .from("v2_content")
      .select("content_type, status")
      .in("status", ["draft", "published"]);

    data?.forEach((record) => {
      const key = record.content_type as ContentType;
      const current = counts.get(key) ?? { drafts: 0, published: 0 };

      if (record.status === "draft") current.drafts += 1;
      if (record.status === "published") current.published += 1;
      counts.set(key, current);
    });
  }

  const modules = contentCatalog.map((entry) => ({
    ...entry,
    ...(counts.get(entry.key) ?? { drafts: 0, published: 0 }),
  }));

  return {
    configured: Boolean(client),
    modules,
    totals: {
      drafts: modules.reduce((total, module) => total + module.drafts, 0),
      published: modules.reduce((total, module) => total + module.published, 0),
      modules: modules.length,
    },
  };
}
