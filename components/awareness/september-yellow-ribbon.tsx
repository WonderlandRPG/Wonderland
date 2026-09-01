"use client";

import { useRef, useState } from "react";
import styles from "./september-yellow-ribbon.module.css";

const CAMPAIGN_YEAR = 2026;

function isCampaignActive(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return year === CAMPAIGN_YEAR && month === 9;
}

export function SeptemberYellowRibbon() {
  const [active] = useState(() => isCampaignActive());
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!active) return null;

  const openDialog = () => dialogRef.current?.showModal();
  const closeDialog = () => dialogRef.current?.close();

  return (
    <>
      <button
        aria-label="Abrir mensagem do Setembro Amarelo"
        className={styles.trigger}
        onClick={openDialog}
        type="button"
      >
        <span aria-hidden="true" className={styles.ribbon} />
        <span>Setembro Amarelo</span>
      </button>

      <dialog
        aria-labelledby="september-yellow-title"
        className={styles.dialog}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        ref={dialogRef}
      >
        <button
          aria-label="Fechar mensagem"
          className={styles.close}
          onClick={closeDialog}
          type="button"
        >
          ×
        </button>
        <span aria-hidden="true" className={styles.largeRibbon} />
        <small>Setembro Amarelo</small>
        <h2 id="september-yellow-title">Você não precisa enfrentar tudo sozinho.</h2>
        <p>
          A equipe de Wonderland se importa com você e está aqui para acolher, ouvir e ajudar
          você a encontrar apoio. Pedir ajuda é um ato de coragem.
        </p>

        <section className={styles.help}>
          <span>Encontre ajuda</span>
          <h3>CVV — Centro de Valorização da Vida</h3>
          <a className={styles.phone} href="tel:188">Ligue 188</a>
          <dl>
            <div>
              <dt>Telefone</dt>
              <dd>24 horas por dia, todos os dias. Ligação gratuita.</dd>
            </div>
            <div>
              <dt>Chat</dt>
              <dd>Segunda a sexta, 08h–00h; sábado, 13h–00h; domingo, 15h–00h.</dd>
            </div>
          </dl>
          <a
            className={styles.chat}
            href="https://cvv.org.br/chat/"
            rel="noreferrer"
            target="_blank"
          >
            Acessar o chat oficial do CVV
          </a>
        </section>
      </dialog>
    </>
  );
}
