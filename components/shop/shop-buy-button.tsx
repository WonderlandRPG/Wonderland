"use client";

import { useFormStatus } from "react-dom";

export function ShopBuyButton({
  disabled,
  itemName,
  compact = false,
}: {
  disabled: boolean;
  itemName?: string;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={compact ? "is-compact" : ""}
      disabled={disabled || pending}
      onClick={(event) => {
        if (!disabled && itemName && !window.confirm(`Comprar ${itemName}?`))
          event.preventDefault();
      }}
      type="submit"
    >
      {pending
        ? "Comprando…"
        : disabled
          ? "WG insuficiente"
          : compact
            ? "Comprar"
            : "Confirmar compra"}
    </button>
  );
}
