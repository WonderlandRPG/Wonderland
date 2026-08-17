"use client";

import { useRef, useState } from "react";

export function ItemImageField({ initialUrl, itemName }: { initialUrl: string | null; itemName: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError("");
    setStatus("");
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("A imagem precisa ter no máximo 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("image", file);
      const response = await fetch("/api/admin/update-images", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Não foi possível enviar a imagem.");
      setUrl(data.url);
      setStatus("Imagem enviada. Salve o item para aplicar a alteração.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="admin-item-image-field">
      <div
        className={`admin-item-image-preview ${url ? "has-image" : ""}`}
        style={url ? { backgroundImage: `url(${url})` } : undefined}
        role="img"
        aria-label={url ? `Prévia da imagem de ${itemName}` : `Item ${itemName} sem imagem`}
      >
        {!url ? <span>Sem imagem personalizada</span> : null}
      </div>
      <div className="admin-item-image-controls">
        <strong>Imagem do item</strong>
        <small>Envie JPG, PNG, WEBP ou GIF de até 8 MB diretamente do computador.</small>
        <label className="admin-upload-picker">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <span>{uploading ? "Enviando imagem…" : "Escolher imagem do computador"}</span>
        </label>
        <label>
          <span>Ou usar uma imagem por link</span>
          <input
            name="imageUrl"
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setStatus("");
              setError("");
            }}
            placeholder="https://exemplo.com/item.webp"
          />
        </label>
        {status ? <p className="admin-item-image-status" role="status">{status}</p> : null}
        {error ? <p className="admin-item-image-status is-error" role="alert">{error}</p> : null}
        {url ? (
          <div className="admin-item-image-actions">
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setStatus("Imagem removida. Salve o item para confirmar.");
                setError("");
              }}
            >
              Remover imagem
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
