"use client";

import { useFormStatus } from "react-dom";

export function ShopBuyButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button disabled={disabled || pending} type="submit">
      {pending ? "Comprando…" : disabled ? "WG insuficiente" : "Comprar"}
    </button>
  );
}
