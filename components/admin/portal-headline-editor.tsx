"use client";

import { useState } from "react";
import { restorePortalHeadlineAction, savePortalHeadlineAction } from "@/app/admin/portal/actions";

export function PortalHeadlineEditor({ initial }: { initial: { firstLine: string; secondLine: string } }) {
  const [firstLine, setFirstLine] = useState(initial.firstLine);
  const [secondLine, setSecondLine] = useState(initial.secondLine);
  return <section className="admin-portal-editor">
    <form action={savePortalHeadlineAction} className="admin-editor-card admin-form">
      <label className="form-field">Primeira linha<input maxLength={80} name="firstLine" onChange={(event)=>setFirstLine(event.target.value)} required value={firstLine}/></label>
      <label className="form-field">Segunda linha<input maxLength={80} name="secondLine" onChange={(event)=>setSecondLine(event.target.value)} required value={secondLine}/></label>
      <div className="admin-portal-editor__actions"><button className="button button--primary" type="submit">Salvar e publicar <span>→</span></button><button className="button button--glass" formAction={restorePortalHeadlineAction}>Restaurar texto padrão</button></div>
    </form>
    <aside className="admin-portal-preview">
      <div className="admin-portal-preview__sky" aria-hidden="true"><i/><i/><i/></div>
      <div className="admin-portal-preview__content"><span className="eyebrow">Prévia da entrada</span><small>WONDERLAND RPG // CRIE SUA LENDA</small><strong>{firstLine || "Primeira linha"}</strong><b>{secondLine || "Segunda linha"}</b><em>A alteração aparece imediatamente na entrada do site.</em></div>
    </aside>
  </section>;
}
