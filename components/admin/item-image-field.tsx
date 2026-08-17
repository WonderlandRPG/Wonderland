"use client";

import { useRef, useState } from "react";

type ItemImageFieldProps = {
  initialUrl: string | null;
  itemName: string;
  label?: string;
  description?: string;
  emptyLabel?: string;
  inputName?: string;
};

export function ItemImageField({
  initialUrl,
  itemName,
  label = "Imagem do item",
  description = "Envie JPG, PNG, WEBP ou GIF de até 8 MB diretamente do computador.",
  emptyLabel = "Sem imagem personalizada",
  inputName = "imageUrl",
}: ItemImageFieldProps) {
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
      setStatus("Imagem enviada. Salve para aplicar a alteração.");
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
        aria-label={url ? `Prévia de ${itemName}` : `${itemName} sem imagem`}
      >
        {!url ? <span>{emptyLabel}</span> : null}
      </div>
      <div className="admin-item-image-controls">
        <strong>{label}</strong>
        <small>{description}</small>
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
            name={inputName}
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setStatus("");
              setError("");
            }}
            placeholder="https://exemplo.com/imagem.webp"
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
                setStatus("Imagem removida. Salve para confirmar.");
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
