import Link from "next/link";

import { getAccessibleAccountAreas } from "@/lib/auth/access";
import type { CurrentAccount } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";

export function AccountAccessPanel({
  account,
  canCreateCharacter,
}: {
  account: CurrentAccount;
  canCreateCharacter: boolean;
}) {
  const areas = getAccessibleAccountAreas(account.role);

  return (
    <section className="account-access-panel" aria-labelledby="account-access-title">
      <header>
        <div>
          <span className="eyebrow">Acessos liberados</span>
          <h2 id="account-access-title">Escolha uma área</h2>
        </div>
        <small>Permissões de {roleLabels[account.role]}</small>
      </header>
      <div className="account-access-grid">
        {areas.map((area) => {
          const disabled = area.key === "new-character" && !canCreateCharacter;

          return (
            <article className={disabled ? "is-disabled" : ""} key={area.key}>
              <span>{area.glyph}</span>
              <div>
                <h3>{area.label}</h3>
                <p>
                  {disabled ? "Os três espaços de personagem já estão ocupados." : area.description}
                </p>
              </div>
              {disabled ? (
                <span className="account-access-grid__disabled">Limite atingido</span>
              ) : (
                <Link aria-label={`Abrir ${area.label}`} href={area.href}>
                  Acessar <span aria-hidden="true">→</span>
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
