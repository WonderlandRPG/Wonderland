"use client";

import { useActionState, useMemo, useState } from "react";
import { importGameContentAction, initialImportState } from "@/app/admin/importar/actions";

export function ContentImportChat() {
  const [state, action, pending] = useActionState(importGameContentAction, initialImportState);
  const [document, setDocument] = useState("");
  const preview = useMemo(() => {
    try {
      const value = JSON.parse(
        document
          .trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, ""),
      );
      return value && typeof value === "object"
        ? (value as {
            type?: string;
            name?: string;
            payload?: { progression?: unknown[]; abilitiesV2?: unknown[]; paths?: unknown[] };
          })
        : null;
    } catch {
      return null;
    }
  }, [document]);

  return (
    <div className="import-chat">
      <aside>
        <span className="import-chat__avatar">W</span>
        <div>
          <small>Assistente de conteúdo</small>
          <h2>Importador do Wonderland</h2>
          <p>
            Cole aqui uma classe ou raça completa gerada no nosso chat. Eu valido o contrato, mostro
            o resumo e crio tudo como rascunho para você revisar.
          </p>
        </div>
      </aside>
      <form action={action}>
        <label>
          <span>Documento estruturado</span>
          <textarea
            name="document"
            value={document}
            onChange={(event) => setDocument(event.target.value)}
            placeholder={'Cole aqui o bloco que começa com { "type": "class" ... }'}
            rows={18}
            required
          />
        </label>
        {preview ? (
          <section className="import-preview">
            <span>Documento reconhecido</span>
            <h3>{preview.name ?? "Sem nome"}</h3>
            <dl>
              <div>
                <dt>Tipo</dt>
                <dd>{preview.type === "race" ? "Raça" : "Classe"}</dd>
              </div>
              <div>
                <dt>Habilidades</dt>
                <dd>
                  {preview.payload?.progression?.length ??
                    preview.payload?.abilitiesV2?.length ??
                    0}
                </dd>
              </div>
              <div>
                <dt>Caminhos</dt>
                <dd>{preview.payload?.paths?.length ?? 0}</dd>
              </div>
            </dl>
          </section>
        ) : document ? (
          <p className="import-chat__invalid">O texto ainda não forma um JSON completo.</p>
        ) : null}
        {state.status === "error" ? (
          <div className="admin-notice admin-notice--error">
            <strong>{state.message}</strong>
            {state.errors?.map((error) => (
              <small key={error}>{error}</small>
            ))}
          </div>
        ) : null}
        <button className="button button--primary" disabled={!preview || pending} type="submit">
          {pending ? "Validando e criando…" : "Validar e criar rascunho"}
        </button>
      </form>
    </div>
  );
}
