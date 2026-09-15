"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./world-navigation.module.css";
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
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  function closeMenu() { setOpen(false); trigger.current?.focus(); }
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);

  return (
    <div className={styles.root} onKeyDown={(event) => { if(event.key === "Escape") closeMenu(); }}>
      <button
        ref={trigger}
        className={styles.trigger}
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
            className={styles.backdrop}
            tabIndex={-1}
            aria-label="Fechar menu Mundo"
            onClick={closeMenu}
            type="button"
          />
          <div
            ref={panel}
            id="player-world-navigation"
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Navegação de Wonderland"
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const items = panel.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
              if (!items?.length) return;
              const first = items[0];
              const last = items[items.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }}
            onClick={(event) => {
              if ((event.target as Element).closest("a")) setOpen(false);
            }}
          >
            <header className={styles.header}><strong>Explore Wonderland</strong><button className={styles.close} type="button" onClick={closeMenu} aria-label="Fechar navegação">×</button></header>
            <nav className={styles.links} aria-label="Destinos do mundo">
            <small>Jornada</small>
            <Link aria-current={pathname === "/personagens" ? "page" : undefined} href="/personagens">Jogar</Link>
            <Link aria-current={pathname === "/arena" ? "page" : undefined} href="/arena">Arena</Link>
            <Link aria-current={pathname === "/missoes" ? "page" : undefined} href="/missoes">Missões</Link>
            <Link href={`/personagens/${activeCharacterId}?tab=equipamentos`}>Equipamentos</Link>
            <Link aria-current={pathname === "/loja" ? "page" : undefined} href="/loja">Loja</Link>
            <Link aria-current={pathname === "/presenca" ? "page" : undefined} href="/presenca">Presença</Link>
            <Link aria-current={pathname === "/diario" ? "page" : undefined} href="/diario">Diário</Link>
            <Link aria-current={pathname === "/notificacoes" ? "page" : undefined} href="/notificacoes">Notificações{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}</Link>
            <small>Comunidade</small>
            <Link aria-current={pathname === "/ranking" ? "page" : undefined} href="/ranking">Ranking</Link>
            <Link aria-current={pathname === "/ranks" ? "page" : undefined} href="/ranks">Ranks</Link>
            <Link aria-current={pathname === "/eventos" ? "page" : undefined} href="/eventos">Eventos</Link>
            <small>Informações</small>
            <Link aria-current={pathname === "/mapas" ? "page" : undefined} href="/mapas">Mapa</Link>
            <Link aria-current={pathname === "/bestiario" ? "page" : undefined} href="/bestiario">Bestiário</Link>
            <Link
              className={hasUnreadUpdate ? "has-unread-update" : undefined}
              href="/atualizacoes"
            >
              Atualizações {hasUnreadUpdate ? <i aria-label="Nova atualização" /> : null}
            </Link>
            <Link aria-current={pathname === "/perfil" ? "page" : undefined} href="/perfil">Minha conta</Link>
            {isAdmin ? <Link aria-current={pathname === "/admin" ? "page" : undefined} href="/admin">Painel ADM</Link> : null}
            <SignOutButton compact />
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
