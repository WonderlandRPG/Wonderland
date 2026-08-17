"use client";

import { useState } from "react";

export function HistoryCoverUpload({ initialUrl = "" }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  const upload = async (file: File | null) => {
    if (!file) return;
    setState("uploading");
    setMessage("");

    const formData = new FormData();
    formData.set("image", file);

    try {
      const response = await fetch("/api/admin/history-images", { method: "POST", body: formData });
      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setState("error");
        setMessage(payload.error || "Não foi possível enviar a imagem da capa.");
        return;
      }
      setUrl(payload.url);
      setState("idle");
    } catch {
      setState("error");
      setMessage("Não foi possível enviar a imagem da capa.");
    }
  };

  return (
    <div className="history-cover-upload">
      <input name="coverImageUrl" type="hidden" value={url} readOnly />
      <label>
        <span>Imagem da capa <small>(opcional)</small></span>
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={state === "uploading"}
          onChange={(event) => void upload(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>
      {state === "uploading" ? <small>Enviando capa...</small> : null}
      {state === "error" ? <small className="is-error">{message}</small> : null}
      {url ? (
        <div className="history-cover-upload__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Prévia da capa da história" src={url} />
          <button onClick={() => setUrl("")} type="button">Remover capa</button>
        </div>
      ) : null}
    </div>
  );
}
