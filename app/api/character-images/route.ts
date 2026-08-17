import { NextResponse } from "next/server";

import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const account = await requireCurrentAccount("/personagens");
    const formData = await request.formData();
    const characterId = String(formData.get("characterId") ?? "").trim();
    const file = formData.get("image");

    if (!characterId || !(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxBytes) {
      return NextResponse.json({ error: "Use uma imagem JPG, PNG, WEBP ou GIF de até 8 MB." }, { status: 400 });
    }

    const client = await createServerSupabaseClient();
    if (!client) return NextResponse.json({ error: "Armazenamento indisponível." }, { status: 503 });

    const { data: character } = await client
      .from("v2_characters")
      .select("id")
      .eq("id", characterId)
      .eq("user_id", account.id)
      .maybeSingle();

    if (!character) return NextResponse.json({ error: "Personagem não encontrado." }, { status: 404 });

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const path = `${account.id}/${characterId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage.from("character-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: "Não foi possível enviar a imagem." }, { status: 400 });

    const { data: publicUrlData } = client.storage.from("character-images").getPublicUrl(path);
    const imageUrl = publicUrlData.publicUrl;
    const { error: updateError } = await client.rpc("v2_set_character_image", {
      p_character_id: characterId,
      p_image_url: imageUrl,
    });

    if (updateError) {
      await client.storage.from("character-images").remove([path]);
      return NextResponse.json({ error: "A imagem foi enviada, mas não foi possível atualizar o personagem." }, { status: 400 });
    }

    return NextResponse.json({ url: imageUrl });
  } catch {
    return NextResponse.json({ error: "Entre na sua conta para alterar o retrato." }, { status: 403 });
  }
}
