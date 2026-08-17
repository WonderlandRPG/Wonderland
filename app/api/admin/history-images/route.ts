import { NextResponse } from "next/server";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const account = await requireAdministrativeAccount();
    const formData = await request.formData();
    const candidate = formData.get("image") ?? formData.get("file") ?? formData.get("cover");

    if (!(candidate instanceof File) || !allowedTypes.has(candidate.type) || candidate.size > maxBytes) {
      return NextResponse.json({ error: "Use JPG, PNG, WEBP ou GIF de até 8 MB." }, { status: 400 });
    }

    const client = await createServerSupabaseClient();
    if (!client) return NextResponse.json({ error: "Armazenamento indisponível." }, { status: 503 });

    const extension = candidate.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const path = `history/${account.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from("update-images").upload(path, candidate, {
      cacheControl: "31536000",
      contentType: candidate.type,
      upsert: false,
    });
    if (error) return NextResponse.json({ error: "Não foi possível enviar a imagem da capa." }, { status: 400 });

    const { data } = client.storage.from("update-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, imageUrl: data.publicUrl });
  } catch {
    return NextResponse.json({ error: "Acesso administrativo necessário." }, { status: 403 });
  }
}
