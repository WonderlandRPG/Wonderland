"use client";
/* eslint-disable react-hooks/set-state-in-effect -- object URL previews are synchronized with the selected file. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CharacterImageUploader({ characterId, currentImageUrl }: { characterId: string; currentImageUrl: string | null }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(currentImageUrl ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(currentImageUrl ?? "");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, currentImageUrl]);

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setStatus("Enviando retrato...");
    try {
      const formData = new FormData();
      formData.set("characterId", characterId);
      formData.set("image", file);
      const response = await fetch("/api/character-images", { method: "POST", body: formData });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setStatus(payload.error ?? "Não foi possível enviar a imagem.");
        return;
      }
      setPreview(payload.url);
      setFile(null);
      setStatus("✓ Retrato atualizado.");
      router.refresh();
    } catch {
      setStatus("Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="character-image-upload">
      <div className="character-image-upload__preview" style={preview ? { backgroundImage: `url(${preview})` } : undefined}>
        {!preview ? <span>Prévia</span> : null}
      </div>
      <div className="character-image-upload__controls">
        <strong>Imagem do dispositivo</strong>
        <p>Escolha uma foto do computador ou celular. JPG, PNG, WEBP ou GIF de até 8 MB.</p>
        <label className="button button--dark">
          Escolher arquivo
          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
        {file ? <small>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</small> : null}
        <button className="button button--primary" disabled={!file || busy} onClick={upload} type="button">
          {busy ? "Enviando..." : "Usar esta imagem"}
        </button>
        {status ? <span className="character-image-upload__status" role="status">{status}</span> : null}
      </div>
    </div>
  );
}
