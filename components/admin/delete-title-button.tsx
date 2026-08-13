"use client";

import { useState } from "react";
import { deleteTitleAdminAction } from "@/app/admin/titulos/actions";

export function DeleteTitleButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming)
    return (
      <button className="button button--danger" onClick={() => setConfirming(true)} type="button">
        Excluir Título
      </button>
    );
  return (
    <form action={deleteTitleAdminAction}>
      <input name="id" type="hidden" value={id} />
      <span>Excluir “{name}” de todos os inventários?</span>
      <button className="button button--danger">Sim, excluir</button>
      <button className="button button--dark" onClick={() => setConfirming(false)} type="button">
        Cancelar
      </button>
    </form>
  );
}
