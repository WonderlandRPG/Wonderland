"use client";

import Link from "next/link";
import { useState } from "react";
import { SignOutButton } from "@/components/account/sign-out-button";

export function PlayerWorldMenu({
  activeCharacterId,
  isAdmin,
  hasUnreadUpdate,
  unreadNotifications,
}: {
  activeCharacterId: string;
  isAdmin: boolean;
  hasUnreadUpdate: boolean;
  unreadNotifications: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`player-nav__world-menu ${open ? "is-open" : ""}`}>
      <button
        aria-expanded={open}
        aria-controls="player-world-navigation"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        Mundo <span aria-hidden="true">{open ? "×" : "⌄"}</span>
      </button>
      {open ? (
        <>
          <button
            className="player-nav__world-backdrop"
            aria-label="Fechar menu Mundo"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            id="player-world-navigation"
            role="dialog"
            aria-label="Navegação de Wonderland"
            onClick={(event) => {
              if ((event.target as Element).closest("a")) setOpen(false);
            }}
          >
            <small>Jornada</small>
            <Link href="/personagens">Jogar</Link>
            <Link href="/arena">Arena</Link>
            <Link href="/missoes">Missões</Link>
            <Link href={`/personagens/${activeCharacterId}?tab=equipamentos`}>Equipamentos</Link>
            <Link href="/loja">Loja</Link>
            <Link href="/presenca">Presença</Link>
            <Link href="/diario">Diário</Link>
            <Link href="/notificacoes">Notificações{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}</Link>
            <small>Comunidade</small>
            <Link href="/ranking">Ranking</Link>
            <Link href="/ranks">Ranks</Link>
            <Link href="/eventos">Eventos</Link>
            <small>Informações</small>
            <Link href="/mapas">Mapa</Link>
            <Link href="/bestiario">Bestiário</Link>
            <Link
              className={hasUnreadUpdate ? "has-unread-update" : undefined}
              href="/atualizacoes"
            >
              Atualizações {hasUnreadUpdate ? <i aria-label="Nova atualização" /> : null}
            </Link>
            <Link href="/perfil">Minha conta</Link>
            {isAdmin ? <Link href="/admin">Painel ADM</Link> : null}
            <SignOutButton compact />
          </div>
        </>
      ) : null}
    </div>
  );
}
