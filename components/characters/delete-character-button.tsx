"use client";

import { deleteCharacterAction } from "@/app/personagens/actions";

export function DeleteCharacterButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCharacterAction.bind(null, id)}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Excluir permanentemente a ficha de ${name}? Esta ação não pode ser desfeita.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button className="button character-delete" type="submit">
        Excluir
      </button>
    </form>
  );
}
