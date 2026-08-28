"use client";

import type { ReactNode } from "react";

export function CombatResultModal({
  victory,
  eyebrow,
  title,
  description,
  children,
}: {
  victory: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`combat-result-modal ${victory ? "is-victory" : "is-defeat"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="combat-result-title"
    >
      <div className="combat-result-modal__backdrop" />
      <div className="combat-result-modal__particles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
      </div>
      <section className="combat-result-modal__panel">
        <span className="combat-result-modal__line" aria-hidden="true" />
        <div className="combat-result-modal__emblem" aria-hidden="true">
          <i>{victory ? "✦" : "◆"}</i>
        </div>
        <small>{eyebrow ?? (victory ? "CONFRONTO CONCLUÍDO" : "CONFRONTO ENCERRADO")}</small>
        <h2 id="combat-result-title">{victory ? "VITÓRIA" : "DERROTA"}</h2>
        <p>{title}</p>
        {description ? <span className="combat-result-modal__description">{description}</span> : null}
        {children ? <div className="combat-result-modal__actions">{children}</div> : null}
      </section>
    </div>
  );
}
