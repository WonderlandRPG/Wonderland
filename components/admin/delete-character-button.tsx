"use client";

import { useState } from "react";
import { deleteCharacterAdminAction } from "@/app/admin/personagens/actions";

export function DeleteCharacterButton({ characterId, characterName }: { characterId: string; characterName: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <form
      action={deleteCharacterAdminAction}
      className="admin-delete-character-form"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Excluir ${characterName}?\n\nEsta ação apaga permanentemente a ficha, inventário, sessões e demais vínculos do personagem. Não é possível desfazer.`,
        );
        if (!confirmed) {
          event.preventDefault();
          return;
        }
        setBusy(true);
      }}
    >
      <input name="characterId" type="hidden" value={characterId} />
      <button className="button admin-delete-character" disabled={busy} type="submit">
        {busy ? "Excluindo…" : "Excluir personagem"}
      </button>
    </form>
  );
}
