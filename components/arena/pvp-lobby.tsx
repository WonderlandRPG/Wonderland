"use client";
/* eslint-disable react-hooks/set-state-in-effect -- realtime party polling updates state from asynchronous callbacks. */

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelPvpPartyInviteAction,
  cancelPvpQueueAction,
  disbandPvpPartyAction,
  getPvpPartyStateAction,
  getRankedProfileAction,
  invitePvpPartnerAction,
  joinPvpQueueAction,
  joinRankedQueueAction,
  pollPvpQueueAction,
  respondPvpMatchAction,
  respondPvpPartyInviteAction,
  searchPvpPartnerAction,
  type PvpPartyState,
  type RankedProfile,
  type QueueCharacter,
  type QueueState,
} from "@/app/arena/pvp-actions";

export function PvpLobby({
  characterId,
  characterName,
  rank,
}: {
  characterId: string;
  characterName: string;
  rank: string;
}) {
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [format, setFormat] = useState<"solo" | "duo" | "trio">("solo");
  const [message, setMessage] = useState("");
  const [partyState, setPartyState] = useState<PvpPartyState | null>(null);
  const [partyOpen, setPartyOpen] = useState(false);
  const [rankedOpen, setRankedOpen] = useState(false);
  const [rankedProfile, setRankedProfile] = useState<RankedProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<QueueCharacter[]>([]);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const router = useRouter();

  const refreshParty = useCallback(async () => {
    const result = await getPvpPartyStateAction(characterId);
    if (!result.ok) return;
    setPartyState(result.data);
    if (result.data.queue?.status === "searching" || result.data.queue?.status === "matched") {
      setQueue(result.data.queue);
      setFormat(result.data.queue.format);
      setPartyOpen(true);
    } else {
      setQueue((current) =>
        current?.format === "duo" || current?.format === "trio" ? null : current,
      );
    }
  }, [characterId]);

  const refreshRanked = useCallback(async () => {
    const result = await getRankedProfileAction(characterId);
    if (result.ok) setRankedProfile(result.data);
  }, [characterId]);

  useEffect(() => {
    void refreshParty();
    void refreshRanked();
    const timer = window.setInterval(() => void refreshParty(), 2500);
    return () => window.clearInterval(timer);
  }, [refreshParty, refreshRanked]);

  useEffect(() => {
    if (queue?.status === "matched" && queue.matchId && queue.acceptanceStatus === "ready") {
      if (queue.format === "duo" || queue.format === "trio")
        router.replace(`/arena/pvp-duo/${queue.matchId}`);
      else router.replace(`/arena?modo=pvp&partida=${queue.matchId}`);
    }
  }, [queue, router]);

  useEffect(() => {
    if (!queue || (queue.status !== "searching" && queue.status !== "matched")) return;
    const timer = window.setInterval(() => {
      void pollPvpQueueAction(queue.queueId).then((result) => {
        if (result.ok) {
          setQueue((current) => {
            if (
              current?.status === "matched" &&
              result.data.status === "matched" &&
              current.matchId === result.data.matchId &&
              (current.acceptedCount ?? 0) > (result.data.acceptedCount ?? 0)
            ) {
              return current;
            }
            return result.data;
          });
        } else setMessage(result.message);
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [queue]);

  useEffect(() => {
    if (queue?.status !== "matched") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [queue?.status]);

  function join(selectedFormat: "solo" | "duo" | "trio") {
    setMessage("");
    setFormat(selectedFormat);
    startTransition(async () => {
      const result = await joinPvpQueueAction(characterId, selectedFormat);
      if (result.ok) {
        setQueue(result.data);
        if (selectedFormat !== "solo") await refreshParty();
      } else setMessage(result.message);
    });
  }

  function joinRanked() {
    setMessage("");
    setFormat("duo");
    startTransition(async () => {
      const result = await joinRankedQueueAction(characterId);
      if (result.ok) {
        setQueue(result.data);
        setRankedOpen(true);
        await refreshParty();
      } else setMessage(result.message);
    });
  }

  function openTeam(selectedFormat: "duo" | "trio") {
    setFormat(selectedFormat);
    setPartyOpen(true);
    setMessage("");
    void refreshParty();
  }

  function searchPartner() {
    setMessage("");
    startTransition(async () => {
      const result = await searchPvpPartnerAction(characterId, searchQuery);
      if (result.ok) setSearchResults(result.data);
      else setMessage(result.message);
    });
  }

  function invite(targetId: string) {
    setMessage("");
    startTransition(async () => {
      const result = await invitePvpPartnerAction(characterId, targetId);
      if (!result.ok) setMessage(result.message);
      else {
        setMessage("Convite enviado. A equipe será atualizada quando o outro jogador aceitar.");
        setSearchResults([]);
        await refreshParty();
      }
    });
  }

  function respond(inviteId: string, accept: boolean) {
    setMessage("");
    startTransition(async () => {
      const result = await respondPvpPartyInviteAction(inviteId, accept);
      if (!result.ok) setMessage(result.message);
      else {
        setMessage(
          accept
            ? "Equipe formada! Ela permanecerá ativa até alguém desfazê-la."
            : "Convite recusado.",
        );
        await refreshParty();
      }
    });
  }

  function cancelInvite(inviteId: string) {
    startTransition(async () => {
      await cancelPvpPartyInviteAction(inviteId);
      await refreshParty();
    });
  }

  function disband() {
    if (!partyState?.party) return;
    setMessage("");
    startTransition(async () => {
      const result = await disbandPvpPartyAction(partyState.party!.id);
      if (!result.ok) setMessage(result.message);
      else {
        setQueue(null);
        setMessage("Equipe desfeita.");
        await refreshParty();
      }
    });
  }

  function cancel() {
    if (!queue) return;
    startTransition(async () => {
      await cancelPvpQueueAction(queue.queueId);
      setQueue(null);
      setMessage("Busca cancelada.");
      await refreshParty();
    });
  }

  function confirmMatch(accept: boolean) {
    if (!queue?.matchId) return;
    setMessage("");
    startTransition(async () => {
      const result = await respondPvpMatchAction(queue.matchId!, accept);
      if (!result.ok) setMessage(result.message);
      else if (!accept || result.data.status !== "matched") {
        setQueue(null);
        setMessage(
          accept ? "O prazo de confirmação terminou." : "Partida recusada. Você saiu desta busca.",
        );
        await refreshParty();
      } else setQueue(result.data);
    });
  }

  const matched = queue?.status === "matched";
  const activeFormat = queue?.format ?? format;
  const party = partyState?.party ?? null;
  const partyMembers = party?.members?.length
    ? party.members
    : party
      ? [party.ownCharacter, party.partner]
      : [];
  const partyUsesActiveCharacter = party?.ownCharacter.id === characterId;
  const acceptanceSeconds = queue?.acceptDeadline
    ? Math.max(0, Math.ceil((Date.parse(queue.acceptDeadline) - now) / 1000))
    : 30;

  return (
    <section className={`pvp-lobby ${matched ? "is-matched" : ""}`}>
      <span className="pvp-lobby__crest">⚔</span>
      <span className="eyebrow">Arena competitiva</span>
      <h1>{matched ? "Confronto encontrado" : "Escolha sua fila PvP"}</h1>
      <p>
        {matched
          ? activeFormat !== "solo"
            ? `Duas equipes reais foram encontradas. Abrindo o campo ${activeFormat === "trio" ? "3x3" : "2x2"}…`
            : "Sala criada. Abrindo o duelo Solo…"
          : "As filas são separadas por Rank para manter partidas equilibradas."}
      </p>

      {!queue || queue.status === "cancelled" || queue.status === "expired" ? (
        <div className="pvp-format-grid">
          <button
            className={`pvp-format-card ${format === "solo" ? "is-selected" : ""}`}
            disabled={pending}
            onClick={() => join("solo")}
            type="button"
          >
            <span>1 × 1</span>
            <strong>Fila Solo</strong>
            <small>Seu personagem contra outro aventureiro do mesmo Rank.</small>
            <b>{pending && format === "solo" ? "Entrando…" : "Buscar duelo"}</b>
          </button>
          <button
            className={`pvp-format-card is-duo ${format === "duo" ? "is-selected" : ""}`}
            disabled={pending}
            onClick={() => openTeam("duo")}
            type="button"
          >
            <span>2 × 2</span>
            <strong>Fila de Duplas</strong>
            <small>
              {party
                ? `Sua dupla está formada com ${party.partner.name}.`
                : "Convide o personagem de outro jogador e formem uma dupla persistente."}
            </small>
            <b>{party ? "Abrir dupla" : "Formar dupla"}</b>
          </button>
          <button
            className={`pvp-format-card is-duo ${format === "trio" ? "is-selected" : ""}`}
            disabled={pending}
            onClick={() => openTeam("trio")}
            type="button"
          >
            <span>3 × 3</span>
            <strong>Fila de Trios</strong>
            <small>
              {partyMembers.length === 3
                ? "Seu trio está pronto para buscar uma partida."
                : "Convide dois jogadores do mesmo Rank para formar o trio."}
            </small>
            <b>{partyMembers.length === 3 ? "Abrir trio" : "Formar trio"}</b>
          </button>
          <button
            className={`pvp-format-card is-ranked ${rankedOpen ? "is-selected" : ""}`}
            disabled={pending}
            onClick={() => {
              setRankedOpen(true);
              setPartyOpen(true);
              setFormat("duo");
            }}
            type="button"
          >
            <span>{rankedProfile?.rating?.tier === "Lenda" ? "✦" : "♛"}</span>
            <strong>Ranqueada 2 × 2</strong>
            <small>
              {rankedProfile?.rating
                ? `${rankedProfile.rating.tier}${rankedProfile.rating.division ? ` ${rankedProfile.rating.division}` : ""} · ${rankedProfile.rating.pdl} PdL`
                : "Temporadas, divisões e classificação competitiva."}
            </small>
            <b>Abrir ranqueada</b>
          </button>
        </div>
      ) : null}

      {rankedOpen && (!queue || queue.status === "cancelled" || queue.status === "expired") ? (
        <section className="pvp-ranked-panel">
          <header>
            <div className="pvp-ranked-crest" aria-hidden="true">
              {rankedProfile?.rating?.tier === "Lenda" ? "✦" : "♛"}
            </div>
            <div>
              <span className="eyebrow">
                {rankedProfile?.season?.name ?? "Temporada ranqueada"}
              </span>
              <h2>
                {rankedProfile?.rating?.tier ?? "Ferro"} {rankedProfile?.rating?.division ?? ""}
              </h2>
              <p>
                {rankedProfile?.rating?.placementMatches ?? 0} de 5 partidas de posicionamento ·{" "}
                {rankedProfile?.rating?.pdl ?? 0} PdL
              </p>
            </div>
          </header>
          <div className="pvp-ranked-stats">
            <span>
              <small>Vitórias</small>
              <strong>{rankedProfile?.rating?.wins ?? 0}</strong>
            </span>
            <span>
              <small>Derrotas</small>
              <strong>{rankedProfile?.rating?.losses ?? 0}</strong>
            </span>
            <span>
              <small>Abandonos</small>
              <strong>{rankedProfile?.rating?.abandons ?? 0}</strong>
            </span>
          </div>
          <p className="pvp-ranked-rule">
            Exclusivamente 2×2. O pareamento aceita apenas seu elo e os elos adjacentes; confrontos
            repetidos e manipulação de equipes são bloqueados.
          </p>
          <button
            className="button button--dark"
            disabled={pending || partyMembers.length !== 2 || !partyUsesActiveCharacter}
            onClick={joinRanked}
            type="button"
          >
            {pending ? "Preparando…" : "Buscar partida ranqueada"}
          </button>
          {partyMembers.length !== 2 ? (
            <small>Forme uma dupla com exatamente dois jogadores.</small>
          ) : null}
          {rankedProfile?.standings?.length ? (
            <details className="pvp-ranked-standing">
              <summary>Classificação da temporada</summary>
              {rankedProfile.standings.slice(0, 10).map((entry) => (
                <div key={entry.characterId}>
                  <b>#{entry.position}</b>
                  <span>{entry.name}</span>
                  <strong>{entry.pdl} PdL</strong>
                </div>
              ))}
            </details>
          ) : null}
        </section>
      ) : null}

      {partyOpen &&
      activeFormat !== "solo" &&
      (!queue || queue.status === "cancelled" || queue.status === "expired") ? (
        <section className={`pvp-party-panel ${party ? "is-formed" : ""}`}>
          <header>
            <div>
              <span className="eyebrow">Equipe {activeFormat === "trio" ? "3x3" : "2x2"}</span>
              <h2>{party ? "Equipe formada" : "Formar equipe"}</h2>
              <p>
                {party
                  ? "A equipe continua ativa entre partidas. Você pode adicionar um terceiro jogador ou desfazê-la."
                  : `Procure personagens Rank ${rank}, envie convites e aguarde o aceite.`}
              </p>
            </div>
            {party ? (
              <span className="pvp-party-status">
                <i /> ATIVA
              </span>
            ) : null}
          </header>
          {party ? (
            <>
              <div className="pvp-party-members">
                {partyMembers.map((member, index) => (
                  <div key={member.id} className="pvp-party-members">
                    <PartyMember
                      label={member.id === party.ownCharacter.id ? "VOCÊ" : `PARCEIRO ${index}`}
                      character={member}
                    />
                    {index < partyMembers.length - 1 ? (
                      <span className="pvp-party-link">＋</span>
                    ) : null}
                  </div>
                ))}
              </div>
              {!partyUsesActiveCharacter ? (
                <p className="pvp-party-warning">
                  Esta equipe foi formada com <strong>{party.ownCharacter.name}</strong>. Selecione
                  esse personagem como ativo para entrar na fila.
                </p>
              ) : null}
              {partyMembers.length < 3 ? (
                <div className="pvp-party-search">
                  <label>
                    <span>Adicionar jogador à equipe</span>
                    <div>
                      <input
                        maxLength={60}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            searchPartner();
                          }
                        }}
                        placeholder="Digite o nome do personagem…"
                        value={searchQuery}
                      />
                      <button
                        disabled={pending || searchQuery.trim().length < 2}
                        onClick={searchPartner}
                        type="button"
                      >
                        Procurar
                      </button>
                    </div>
                  </label>
                  {searchResults.length ? (
                    <div className="pvp-party-search-results">
                      {searchResults.map((entry) => (
                        <article key={entry.id}>
                          <PartyAvatar character={entry} />
                          <div>
                            <strong>{entry.name}</strong>
                            <span>
                              Lv. {entry.level} · Rank {entry.rank}
                            </span>
                          </div>
                          <button disabled={pending} onClick={() => invite(entry.id)} type="button">
                            Convidar
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="pvp-party-actions">
                <button
                  className="button button--dark"
                  disabled={
                    pending ||
                    !partyUsesActiveCharacter ||
                    partyMembers.length !== (activeFormat === "trio" ? 3 : 2)
                  }
                  onClick={() => join(activeFormat)}
                  type="button"
                >
                  {pending ? "Preparando…" : `Buscar ${activeFormat === "trio" ? "3x3" : "2x2"}`}
                </button>
                <button
                  className="button button--ghost"
                  disabled={pending}
                  onClick={disband}
                  type="button"
                >
                  Desfazer equipe
                </button>
              </div>
            </>
          ) : (
            <>
              {partyState?.incoming.length ? (
                <div className="pvp-party-invites">
                  <h3>Convites recebidos</h3>
                  {partyState.incoming.map((entry) => (
                    <article key={entry.id}>
                      <PartyAvatar character={entry.character} />
                      <div>
                        <small>QUER FORMAR DUPLA</small>
                        <strong>{entry.character.name}</strong>
                        <span>
                          Lv. {entry.character.level} · Rank {entry.character.rank}
                        </span>
                      </div>
                      <div className="pvp-party-invite-actions">
                        <button
                          disabled={pending}
                          onClick={() => respond(entry.id, true)}
                          type="button"
                        >
                          Aceitar
                        </button>
                        <button
                          disabled={pending}
                          onClick={() => respond(entry.id, false)}
                          type="button"
                        >
                          Recusar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
              <div className="pvp-party-search">
                <label>
                  <span>Procurar personagem</span>
                  <div>
                    <input
                      maxLength={60}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          searchPartner();
                        }
                      }}
                      placeholder="Digite o nome do personagem…"
                      value={searchQuery}
                    />
                    <button
                      disabled={pending || searchQuery.trim().length < 2}
                      onClick={searchPartner}
                      type="button"
                    >
                      Procurar
                    </button>
                  </div>
                </label>
                {searchResults.length ? (
                  <div className="pvp-party-search-results">
                    {searchResults.map((entry) => (
                      <article key={entry.id}>
                        <PartyAvatar character={entry} />
                        <div>
                          <strong>{entry.name}</strong>
                          <span>
                            Lv. {entry.level} · Rank {entry.rank}
                          </span>
                        </div>
                        <button disabled={pending} onClick={() => invite(entry.id)} type="button">
                          Convidar
                        </button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
              {partyState?.outgoing.length ? (
                <div className="pvp-party-outgoing">
                  <h3>Convites enviados</h3>
                  {partyState.outgoing.map((entry) => (
                    <article key={entry.id}>
                      <PartyAvatar character={entry.character} />
                      <div>
                        <strong>{entry.character.name}</strong>
                        <span>Aguardando resposta…</span>
                      </div>
                      <button
                        disabled={pending}
                        onClick={() => cancelInvite(entry.id)}
                        type="button"
                      >
                        Cancelar
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <div className="pvp-lobby__facts">
        <article>
          <small>Seu personagem</small>
          <strong>{characterName}</strong>
        </article>
        <article>
          <small>Balanceamento</small>
          <strong>Somente Rank {rank}</strong>
        </article>
        <article>
          <small>Formato atual</small>
          <strong>
            {activeFormat === "trio"
              ? "Trios 3 × 3"
              : activeFormat === "duo"
                ? "Duplas 2 × 2"
                : "Solo 1 × 1"}
          </strong>
        </article>
      </div>
      {queue?.status === "searching" && queue.secondaryCharacter ? (
        <div className="pvp-duo-partner">
          <small>SEU PARCEIRO DE EQUIPE</small>
          <strong>{queue.secondaryCharacter.name}</strong>
          <span>
            Lv. {queue.secondaryCharacter.level} · Rank {queue.secondaryCharacter.rank}
          </span>
        </div>
      ) : null}
      {matched && queue.opponent ? (
        <div className="pvp-match-card">
          <span
            className={queue.opponent.imageUrl ? "is-image" : ""}
            style={
              queue.opponent.imageUrl
                ? { backgroundImage: `url(${queue.opponent.imageUrl})` }
                : undefined
            }
          >
            {queue.opponent.imageUrl ? "" : queue.opponent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <small>OPONENTE · RANK {queue.opponent.rank}</small>
            <strong>{queue.opponent.name}</strong>
            {queue.opponentSecondary ? (
              <p>Dupla com {queue.opponentSecondary.name}</p>
            ) : (
              <p>Preparando a Arena…</p>
            )}
          </div>
          <b>VS</b>
        </div>
      ) : null}
      {matched && queue.matchId && queue.acceptanceStatus !== "ready" ? (
        <div
          className="pvp-ready-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pvp-ready-title"
        >
          <section className="pvp-ready-check">
            <span className="pvp-ready-check__icon">⚔️</span>
            <small>
              ARENA PvP ·{" "}
              {activeFormat === "trio" ? "3 × 3" : activeFormat === "duo" ? "2 × 2" : "1 × 1"}
            </small>
            <h2 id="pvp-ready-title">Partida encontrada!</h2>
            <p>Todos os jogadores precisam confirmar para o combate começar.</p>
            <strong
              className={`pvp-ready-check__timer ${acceptanceSeconds <= 10 ? "is-ending" : ""}`}
            >
              {String(acceptanceSeconds).padStart(2, "0")}s
            </strong>
            <div className="pvp-ready-check__progress">
              <span
                style={{
                  width: `${Math.min(100, ((queue.acceptedCount ?? 0) / Math.max(1, queue.requiredCount ?? 1)) * 100)}%`,
                }}
              />
            </div>
            <b>
              {queue.acceptedCount ?? 0} de{" "}
              {queue.requiredCount ??
                (activeFormat === "trio" ? 6 : activeFormat === "duo" ? 4 : 2)}{" "}
              confirmaram
            </b>
            {queue.acceptedByYou ? (
              <div className="pvp-ready-check__accepted">
                ✓ Você confirmou · aguardando os demais
              </div>
            ) : (
              <div className="pvp-ready-check__actions">
                <button
                  disabled={pending || acceptanceSeconds === 0}
                  onClick={() => confirmMatch(true)}
                  type="button"
                >
                  Sim, estou pronto
                </button>
                <button disabled={pending} onClick={() => confirmMatch(false)} type="button">
                  Recusar
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}
      {queue?.status === "searching" ? (
        <>
          <button className="button button--dark" disabled={pending} onClick={cancel} type="button">
            Cancelar busca
          </button>
          <em>
            <span className="signal-dot" /> Procurando{" "}
            {activeFormat === "trio"
              ? "outro trio"
              : activeFormat === "duo"
                ? "outra dupla"
                : "outro personagem"}{" "}
            Rank {rank}…
          </em>
        </>
      ) : null}
      {message ? <p className="arena-result__error pvp-party-message">{message}</p> : null}
    </section>
  );
}

function PartyAvatar({ character }: { character: QueueCharacter }) {
  return (
    <span
      className="pvp-party-avatar"
      style={character.imageUrl ? { backgroundImage: `url(${character.imageUrl})` } : undefined}
      aria-hidden="true"
    >
      {character.imageUrl ? "" : character.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function PartyMember({ label, character }: { label: string; character: QueueCharacter }) {
  return (
    <article>
      <PartyAvatar character={character} />
      <small>{label}</small>
      <strong>{character.name}</strong>
      <span>
        Lv. {character.level} · Rank {character.rank}
      </span>
    </article>
  );
}
