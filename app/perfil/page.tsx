import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/components/account/profile-form";
import { PlayerNav } from "@/components/player-nav";
import { roleLabels } from "@/lib/auth/account";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { RankBadge } from "@/components/characters/rank-badge";
import { getAdventureRank } from "@/lib/game/ranks";

export const metadata: Metadata = { title: "Minha conta" };

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  "conta-confirmada": "Conta confirmada! Seu acesso ao Wonderland está ativo.",
  "conta-criada": "Sua conta foi criada e já está ativa.",
  "senha-alterada": "Sua senha foi atualizada com segurança.",
  "acesso-negado": "Sua conta não possui permissão para acessar o Painel ADM.",
};

interface ProfilePageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { account, characterId: activeCharacterId } = await requireActiveCharacter("/perfil");
  const [activeCharacter, params] = await Promise.all([
    requireCharacterSheet(activeCharacterId),
    searchParams,
  ]);
  const joinedAt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(account.createdAt));
  const initials = account.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const activeRank = getAdventureRank(activeCharacter.adventure_rank);

  return (
    <main className="account-shell">
      <PlayerNav />

      <div className="account-grid" />
      <section className="account-hero page-container">
        <div className="account-avatar" aria-hidden="true">
          {initials || "W"}
        </div>
        <div>
          <span className="eyebrow">Identidade do jogador</span>
          <h1>{account.displayName}</h1>
          <p>
            {roleLabels[account.role]} <span>•</span> Membro desde {joinedAt}
          </p>
        </div>
        <span className={`role-badge role-badge--${account.role}`}>{roleLabels[account.role]}</span>
      </section>

      <div className="account-content page-container">
        {params.status && statusMessages[params.status] ? (
          <div
            className={`account-notice ${params.status === "acesso-negado" ? "is-warning" : ""}`}
            role="status"
          >
            <span aria-hidden="true">{params.status === "acesso-negado" ? "!" : "✓"}</span>
            {statusMessages[params.status]}
          </div>
        ) : null}

        <section className="account-dashboard">
          <div className="account-main-column">
            <article className="account-card account-profile-intro">
              <div className="account-card__heading">
                <div>
                  <span className="eyebrow">Configurações da conta</span>
                  <h2>Seu perfil de jogador</h2>
                </div>
              </div>
              <p>
                Gerencie apenas os dados da sua conta aqui. Personagem, inventário, nível e presença
                ficam concentrados na ficha em jogo.
              </p>
            </article>

            <article className="account-card">
              <div className="account-card__heading">
                <div>
                  <span className="eyebrow">Dados públicos</span>
                  <h2>Editar perfil</h2>
                </div>
              </div>
              <ProfileForm displayName={account.displayName} />
            </article>
          </div>

          <aside className="account-side-column">
            <article className="account-card account-summary">
              <span className="eyebrow">Resumo da conta</span>
              <dl>
                <div>
                  <dt>E-mail</dt>
                  <dd>{account.email}</dd>
                </div>
                <div>
                  <dt>Função</dt>
                  <dd>{roleLabels[account.role]}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd className="is-online">Conta ativa</dd>
                </div>
              </dl>
            </article>

            <article
              className="account-card account-active-character"
              style={{ "--card-rank": activeRank.color } as React.CSSProperties}
              data-card-rank={activeRank.key}
            >
              <div
                className={`account-active-character__portrait ${activeCharacter.image_url ? "is-image" : ""}`}
                style={
                  activeCharacter.image_url
                    ? { backgroundImage: `url(${activeCharacter.image_url})` }
                    : undefined
                }
              >
                {activeCharacter.image_url ? "" : activeCharacter.name.slice(0, 2).toUpperCase()}
                <span>Online</span>
                <RankBadge compact rank={activeCharacter.adventure_rank} />
              </div>
              <small>Personagem em jogo</small>
              <h2>{activeCharacter.name}</h2>
              <p>
                {activeCharacter.race.name} · {activeCharacter.characterClass.name} · Nível{" "}
                {activeCharacter.level}
              </p>
              <div>
                <Link
                  className="button button--primary"
                  href={`/personagens/${activeCharacter.id}`}
                >
                  Abrir ficha
                </Link>
                <Link className="button button--glass" href="/personagens?selecionar=1">
                  Trocar
                </Link>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
