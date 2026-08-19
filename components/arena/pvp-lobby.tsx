"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelPvpPartyInviteAction,
  cancelPvpQueueAction,
  disbandPvpPartyAction,
  getPvpPartyStateAction,
  invitePvpPartnerAction,
  joinPvpQueueAction,
  pollPvpQueueAction,
  respondPvpPartyInviteAction,
  searchPvpPartnerAction,
  type PvpPartyState,
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
  const [format, setFormat] = useState<"solo" | "duo">("solo");
  const [message, setMessage] = useState("");
  const [partyState, setPartyState] = useState<PvpPartyState | null>(null);
  const [partyOpen, setPartyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<QueueCharacter[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const refreshParty = useCallback(async () => {
    const result = await getPvpPartyStateAction(characterId);
    if (!result.ok) return;
    setPartyState(result.data);
    if (result.data.queue?.status === "searching" || result.data.queue?.status === "matched") {
      setQueue(result.data.queue);
      setFormat("duo");
      setPartyOpen(true);
    }
  }, [characterId]);

  useEffect(() => {
    void refreshParty();
    const timer = window.setInterval(() => void refreshParty(), 2500);
    return () => window.clearInterval(timer);
  }, [refreshParty]);

  useEffect(() => {
    if (queue?.status === "matched" && queue.matchId) {
      if (queue.format === "duo") router.replace(`/arena/pvp-duo/${queue.matchId}`);
      else router.replace(`/arena?modo=pvp&partida=${queue.matchId}`);
    }
  }, [queue, router]);

  useEffect(() => {
    if (!queue || queue.status !== "searching") return;
    const timer = window.setInterval(() => {
      void pollPvpQueueAction(queue.queueId).then((result) => {
        if (result.ok) setQueue(result.data);
        else setMessage(result.message);
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [queue]);

  function join(selectedFormat: "solo" | "duo") {
    setMessage("");
    setFormat(selectedFormat);
    startTransition(async () => {
      const result = await joinPvpQueueAction(characterId, selectedFormat);
      if (result.ok) {
        setQueue(result.data);
        if (selectedFormat === "duo") await refreshParty();
      } else setMessage(result.message);
    });
  }

  function openDuo() {
    setFormat("duo");
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
        setMessage("Convite enviado. A dupla será formada quando o outro jogador aceitar.");
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
        setMessage(accept ? "Dupla formada! Vocês permanecerão juntos até alguém desfazer a dupla." : "Convite recusado.");
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
        setMessage("Dupla desfeita.");
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

  const matched = queue?.status === "matched";
  const activeFormat = queue?.format ?? format;
  const party = partyState?.party ?? null;
  const partyUsesActiveCharacter = party?.ownCharacter.id === characterId;

  return (
    <section className={`pvp-lobby ${matched ? "is-matched" : ""}`}>
      <span className="pvp-lobby__crest">⚔</span>
      <span className="eyebrow">Arena competitiva</span>
      <h1>{matched ? "Confronto encontrado" : "Escolha sua fila PvP"}</h1>
      <p>
        {matched
          ? activeFormat === "duo"
            ? "Duas duplas reais foram encontradas. Abrindo o campo 2x2…"
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
            onClick={openDuo}
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
        </div>
      ) : null}

      {partyOpen && activeFormat === "duo" && (!queue || queue.status === "cancelled" || queue.status === "expired") ? (
        <section className={`pvp-party-panel ${party ? "is-formed" : ""}`}>
          <header>
            <div>
              <span className="eyebrow">Equipe 2x2</span>
              <h2>{party ? "Dupla formada" : "Formar dupla"}</h2>
              <p>
                {party
                  ? "A dupla continua ativa entre partidas e só termina quando um dos jogadores clicar em Desfazer dupla."
                  : `Procure um personagem Rank ${rank}, envie o convite e aguarde o aceite.`}
              </p>
            </div>
            {party ? <span className="pvp-party-status"><i /> ATIVA</span> : null}
          </header>

          {party ? (
            <>
              <div className="pvp-party-members">
                <PartyMember label="VOCÊ" character={party.ownCharacter} />
                <span className="pvp-party-link">＋</span>
                <PartyMember label="PARCEIRO" character={party.partner} />
              </div>
              {!partyUsesActiveCharacter ? (
                <p className="pvp-party-warning">
                  Esta dupla foi formada com <strong>{party.ownCharacter.name}</strong>. Selecione esse personagem como ativo para entrar no 2x2.
                </p>
              ) : null}
              <div className="pvp-party-actions">
                <button
                  className="button button--dark"
                  disabled={pending || !partyUsesActiveCharacter}
                  onClick={() => join("duo")}
                  type="button"
                >
                  {pending ? "Preparando…" : `Buscar 2x2 com ${party.partner.name}`}
                </button>
                <button className="button button--ghost" disabled={pending} onClick={disband} type="button">
                  Desfazer dupla
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
                      <div><small>QUER FORMAR DUPLA</small><strong>{entry.character.name}</strong><span>Lv. {entry.character.level} · Rank {entry.character.rank}</span></div>
                      <div className="pvp-party-invite-actions">
                        <button disabled={pending} onClick={() => respond(entry.id, true)} type="button">Aceitar</button>
                        <button disabled={pending} onClick={() => respond(entry.id, false)} type="button">Recusar</button>
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
                    <button disabled={pending || searchQuery.trim().length < 2} onClick={searchPartner} type="button">
                      Procurar
                    </button>
                  </div>
                </label>
                {searchResults.length ? (
                  <div className="pvp-party-search-results">
                    {searchResults.map((entry) => (
                      <article key={entry.id}>
                        <PartyAvatar character={entry} />
                        <div><strong>{entry.name}</strong><span>Lv. {entry.level} · Rank {entry.rank}</span></div>
                        <button disabled={pending} onClick={() => invite(entry.id)} type="button">Convidar</button>
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
                      <div><strong>{entry.character.name}</strong><span>Aguardando resposta…</span></div>
                      <button disabled={pending} onClick={() => cancelInvite(entry.id)} type="button">Cancelar</button>
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
          <strong>{activeFormat === "duo" ? "Duplas 2 × 2" : "Solo 1 × 1"}</strong>
        </article>
      </div>

      {queue?.status === "searching" && queue.secondaryCharacter ? (
        <div className="pvp-duo-partner">
          <small>SEU PARCEIRO DE EQUIPE</small>
          <strong>{queue.secondaryCharacter.name}</strong>
          <span>Lv. {queue.secondaryCharacter.level} · Rank {queue.secondaryCharacter.rank}</span>
        </div>
      ) : null}

      {matched && queue.opponent ? (
        <div className="pvp-match-card">
          <span
            className={queue.opponent.imageUrl ? "is-image" : ""}
            style={queue.opponent.imageUrl ? { backgroundImage: `url(${queue.opponent.imageUrl})` } : undefined}
          >
            {queue.opponent.imageUrl ? "" : queue.opponent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <small>OPONENTE · RANK {queue.opponent.rank}</small>
            <strong>{queue.opponent.name}</strong>
            {queue.opponentSecondary ? <p>Dupla com {queue.opponentSecondary.name}</p> : <p>Preparando a Arena…</p>}
          </div>
          <b>VS</b>
        </div>
      ) : null}

      {queue?.status === "searching" ? (
        <>
          <button className="button button--dark" disabled={pending} onClick={cancel} type="button">
            Cancelar busca
          </button>
          <em>
            <span className="signal-dot" /> Procurando {activeFormat === "duo" ? "outra dupla" : "outro personagem"} Rank {rank}…
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
      <span>Lv. {character.level} · Rank {character.rank}</span>
    </article>
  );
}
