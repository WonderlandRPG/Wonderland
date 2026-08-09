import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/components/account/profile-form";
import { SignOutButton } from "@/components/account/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import { isAdministrativeRole, roleLabels } from "@/lib/auth/account";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { claimDailyReward } from "./player-actions";
import { getCharacterRules } from "@/lib/content/character-settings";
import { getCharacterSheets } from "@/lib/content/characters";

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
  const { account, characterId } = await requireActiveCharacter("/perfil");
  const client = await createServerSupabaseClient();
  const [{ data: progress }, characters, characterRules, params] = await Promise.all([
    client
      ? client
          .from("v2_player_progress")
          .select("level,experience,coins,daily_streak,last_daily_claim")
          .eq("user_id", account.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getCharacterSheets(account.id),
    getCharacterRules(),
    searchParams,
  ]);
  const level = progress?.level ?? 1;
  const experience = progress?.experience ?? 0;
  const nextLevelXp = Math.round(100 * Math.pow(1.18, level - 1));
  const claimedToday = progress?.last_daily_claim === new Date().toISOString().slice(0, 10);
  const activeCharacter = characters.find((character) => character.id === characterId);
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

  return (
    <main className="account-shell">
      <header className="account-header">
        <div>
          <BrandMark inverse />
        </div>
        <nav aria-label="Navegação da conta">
          <Link href="/">Portal</Link>
          <Link href="/personagens">Personagens</Link>
          {isAdministrativeRole(account.role) ? <Link href="/admin">Painel ADM</Link> : null}
          <SignOutButton compact />
        </nav>
      </header>

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
        <section className="player-progress-strip">
          <div>
            <small>Nível atual</small>
            <strong>{level}</strong>
          </div>
          <div className="player-xp">
            <small>Experiência</small>
            <strong>
              {experience.toLocaleString("pt-BR")} / {nextLevelXp.toLocaleString("pt-BR")} XP
            </strong>
            <span>
              <i style={{ width: `${Math.min(100, (experience / nextLevelXp) * 100)}%` }} />
            </span>
          </div>
          <div>
            <small>WG de {activeCharacter?.name ?? "personagem"}</small>
            <strong>◆ {(activeCharacter?.gold ?? 0).toLocaleString("pt-BR")}</strong>
          </div>
          <form action={claimDailyReward}>
            <button className="button button--primary" disabled={claimedToday}>
              {claimedToday
                ? `Sequência: ${progress?.daily_streak ?? 1} dias`
                : "Coletar recompensa diária"}
            </button>
          </form>
        </section>
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
            <article className="account-card account-card--characters">
              <div className="account-card__heading">
                <div>
                  <span className="eyebrow">Personagens</span>
                  <h2>Suas fichas</h2>
                </div>
                <span className="account-card__counter">
                  {characters.length} / {characterRules.maximumSlots}
                </span>
              </div>

              <div className="character-slots">
                {Array.from({ length: characterRules.maximumSlots }, (_, index) => index + 1).map(
                  (slot) => (
                    <div className="character-slot" key={slot}>
                      <span>{String(slot).padStart(2, "0")}</span>
                      <div>
                        <strong>{characters[slot - 1]?.name ?? "Espaço disponível"}</strong>
                        <small>
                          {characters[slot - 1]
                            ? `${characters[slot - 1].race.name} · ${characters[slot - 1].characterClass.name} · Nível ${characters[slot - 1].level}`
                            : "Crie um novo herói para entrar na Arena."}
                        </small>
                      </div>
                      <Link
                        href={
                          characters[slot - 1]
                            ? `/personagens/${characters[slot - 1].id}`
                            : "/personagens/novo"
                        }
                        aria-label={
                          characters[slot - 1]
                            ? `Ver ${characters[slot - 1].name}`
                            : `Criar personagem no espaço ${slot}`
                        }
                      >
                        {characters[slot - 1] ? "→" : "＋"}
                      </Link>
                    </div>
                  ),
                )}
              </div>
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
                  <dt>Personagens</dt>
                  <dd>
                    {characters.length} de {characterRules.maximumSlots}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd className="is-online">Conta ativa</dd>
                </div>
              </dl>
            </article>

            <article className="account-card account-coming-soon">
              <span>Prepare-se para a Arena</span>
              <h2>Monte sua primeira ficha</h2>
              <p>
                Escolha raça e classe, distribua seus atributos e conheça as habilidades que serão
                liberadas durante a progressão.
              </p>
              <Link className="button button--primary" href="/personagens">
                Ver personagens
              </Link>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
