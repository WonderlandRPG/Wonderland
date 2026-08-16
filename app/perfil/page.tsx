import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/components/account/profile-form";
import { PlayerNav } from "@/components/player-nav";
import { roleLabels } from "@/lib/auth/account";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { RankBadge } from "@/components/characters/rank-badge";
import { getAdventureRank } from "@/lib/game/ranks";
import { EquippedTitle } from "@/components/characters/equipped-title";

export const metadata: Metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  "conta-confirmada": "Conta confirmada! Seu acesso ao Wonderland está ativo.",
  "conta-criada": "Sua conta foi criada e já está ativa.",
  "senha-alterada": "Sua senha foi atualizada com segurança.",
  "acesso-negado": "Sua conta não possui permissão para acessar o Painel ADM.",
};

interface ProfilePageProps { searchParams: Promise<{ status?: string }> }

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { account, characterId: activeCharacterId } = await requireActiveCharacter("/perfil");
  const [activeCharacter, params] = await Promise.all([requireCharacterSheet(activeCharacterId), searchParams]);
  const joinedAt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(account.createdAt));
  const initials = account.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  const activeRank = getAdventureRank(activeCharacter.adventure_rank);
  const equippedTitle = activeCharacter.inventory.find((item) => item.equippedSlot === "title") ?? null;

  return (
    <main className="guild-registry-page">
      <PlayerNav />
      <section className="guild-registry-cover page-container">
        <div className="guild-registry-seal" aria-hidden="true">{initials || "W"}</div>
        <div className="guild-registry-cover__copy">
          <small>ARQUIVO DA GUILDA · REGISTRO DO JOGADOR</small>
          <h1>{account.displayName}</h1>
          <p>{roleLabels[account.role]} · membro desde {joinedAt}</p>
        </div>
        <div className="guild-registry-cover__mark"><span>W</span><small>WONDERLAND</small></div>
      </section>

      <div className="guild-registry-book page-container">
        {params.status && statusMessages[params.status] ? (
          <div className={`account-notice ${params.status === "acesso-negado" ? "is-warning" : ""}`} role="status">
            <span aria-hidden="true">{params.status === "acesso-negado" ? "!" : "✓"}</span>{statusMessages[params.status]}
          </div>
        ) : null}

        <section className="guild-registry-folio guild-registry-folio--account">
          <header>
            <span>FÓLIO I</span>
            <div><small>IDENTIDADE CIVIL</small><h2>Registro do aventureiro</h2></div>
          </header>
          <dl className="guild-registry-facts">
            <div><dt>Nome de exibição</dt><dd>{account.displayName}</dd></div>
            <div><dt>E-mail</dt><dd>{account.email}</dd></div>
            <div><dt>Função</dt><dd>{roleLabels[account.role]}</dd></div>
            <div><dt>Estado do registro</dt><dd className="is-online">Conta ativa</dd></div>
          </dl>
          <div className="guild-registry-edit">
            <small>ALTERAÇÃO DE REGISTRO</small>
            <h3>Editar nome público</h3>
            <ProfileForm displayName={account.displayName} />
          </div>
        </section>

        <aside className="guild-registry-folio guild-registry-folio--character" style={{ "--card-rank": activeRank.color } as React.CSSProperties} data-card-rank={activeRank.key}>
          <header><span>FÓLIO II</span><div><small>PERSONAGEM ATIVO</small><h2>{activeCharacter.name}</h2></div></header>
          <div className="guild-registry-character-portrait" style={activeCharacter.image_url ? { backgroundImage: `url(${activeCharacter.image_url})` } : undefined}>
            {!activeCharacter.image_url ? activeCharacter.name.slice(0, 2).toUpperCase() : null}
            <RankBadge compact rank={activeCharacter.adventure_rank} />
            <EquippedTitle title={equippedTitle} />
          </div>
          <div className="guild-registry-character-copy">
            <p>{activeCharacter.race.name} · {activeCharacter.characterClass.name}</p>
            <dl><div><dt>Nível</dt><dd>{activeCharacter.level}</dd></div><div><dt>Rank</dt><dd>{activeRank.key}</dd></div></dl>
            <nav>
              <Link className="button button--primary" href={`/personagens/${activeCharacter.id}`}>Abrir ficha</Link>
              <Link className="button button--dark" href="/personagens?selecionar=1">Trocar personagem</Link>
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
