import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const achievements = [
  {
    slug: "primeiros-passos",
    icon: "✦",
    name: "Primeiros passos",
    description: "Crie sua conta em Wonderland.",
  },
  {
    slug: "sete-dias",
    icon: "☼",
    name: "Companheiro fiel",
    description: "Mantenha uma sequência de 7 dias.",
  },
  { slug: "nivel-dez", icon: "♜", name: "Aventureiro", description: "Alcance o nível 10." },
  {
    slug: "colecionador",
    icon: "◆",
    name: "Colecionador",
    description: "Adquira 5 itens na loja.",
  },
];

export const portalEvents = [
  {
    date: "12 AGO",
    title: "Abertura dos Portões",
    type: "Comunidade",
    description: "Boas-vindas, apresentação das regras e encontro dos primeiros aventureiros.",
  },
  {
    date: "16 AGO",
    title: "Expedição em Aokigahara",
    type: "Aventura",
    description: "Uma missão coletiva entre as árvores ancestrais do reino da floresta.",
  },
  {
    date: "23 AGO",
    title: "Arena de Iniciantes",
    type: "Combate",
    description: "Rodada amistosa para conhecer o sistema de batalha.",
  },
];

export const updates = [
  {
    version: "2.2.0",
    date: "09 de agosto de 2026",
    title: "Os portões estão abertos",
    notes: [
      "Portal dos jogadores lançado",
      "Níveis, experiência e economia ativados",
      "Ranking, conquistas e eventos disponíveis",
    ],
  },
  {
    version: "2.1.0",
    date: "06 de agosto de 2026",
    title: "Raças oficiais",
    notes: ["Catálogo de raças revisado", "Contas e permissões fortalecidas"],
  },
];

export async function getRanking() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data: progress } = await client
    .from("v2_player_progress")
    .select("user_id, level, experience, daily_streak")
    .order("level", { ascending: false })
    .order("experience", { ascending: false })
    .limit(50);
  if (!progress?.length) return [];
  const { data: profiles } = await client
    .from("v2_profiles")
    .select("user_id, display_name, avatar_url")
    .in(
      "user_id",
      progress.map((row) => row.user_id),
    );
  const names = new Map((profiles ?? []).map((row) => [row.user_id, row]));
  return progress.map((row, index) => ({
    ...row,
    rank: index + 1,
    displayName: names.get(row.user_id)?.display_name || "Aventureiro",
    avatarUrl: names.get(row.user_id)?.avatar_url ?? null,
  }));
}

export async function getShopItems() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from("v2_shop_items")
    .select("id, slug, name, description, category, price, image_url")
    .eq("active", true)
    .order("price");
  return data ?? [];
}
