"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import {
  findRealmLocationsInText,
  getRealmLocations,
  realmLocations,
  type RealmLocation,
} from "@/lib/game/realm-locations";
import { realmLore } from "@/lib/game/world-lore";

import styles from "./realm-location-explorer.module.css";

const locationEvent = "wonderland:open-realm-location";

function openLocation(key: string) {
  window.dispatchEvent(new CustomEvent(locationEvent, { detail: { key } }));
}

function openLocationFromKeyboard(event: ReactKeyboardEvent, key: string) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openLocation(key);
}

function artworkStyle(location: RealmLocation) {
  const { columns, rows, column, row } = location.grid;
  const x = columns === 1 ? 50 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 50 : (row / (rows - 1)) * 100;
  return {
    "--location-image": `url("${location.image}")`,
    "--location-size": `${columns * 100}% ${rows * 100}%`,
    "--location-position": `${x}% ${y}%`,
  } as CSSProperties;
}

export function RealmLocationText({
  text,
  variant = "inline",
}: {
  text: string;
  variant?: "inline" | "title";
}) {
  const mentions = useMemo(
    () =>
      findRealmLocationsInText(text)
        .map((location) => ({ location, index: text.indexOf(location.name) }))
        .filter((entry) => entry.index >= 0)
        .sort((left, right) => left.index - right.index),
    [text],
  );

  if (!mentions.length) return text;

  const content: ReactNode[] = [];
  let cursor = 0;
  mentions.forEach(({ location, index }) => {
    if (index < cursor) return;
    if (index > cursor) content.push(text.slice(cursor, index));
    content.push(
      <span
        className={`${styles.mention} ${variant === "title" ? styles.mentionTitle : ""}`}
        key={`${location.key}-${index}`}
        onClick={() => openLocation(location.key)}
        onKeyDown={(event) => openLocationFromKeyboard(event, location.key)}
        role="button"
        tabIndex={0}
        title={`Conhecer ${location.name}`}
      >
        {location.name}
        <span aria-hidden="true">↗</span>
      </span>,
    );
    cursor = index + location.name.length;
  });
  if (cursor < text.length) content.push(text.slice(cursor));
  return content;
}

export function RealmLocationAtlas({ realmKey }: { realmKey: string }) {
  const locations = getRealmLocations(realmKey);
  return (
    <section className={styles.atlas} aria-labelledby={`${realmKey}-locations-title`}>
      <header>
        <div>
          <small>LOCAIS CONHECIDOS</small>
          <h3 id={`${realmKey}-locations-title`}>Explore os cenários deste Reino</h3>
        </div>
        <p>Selecione um local para ver sua arte e conhecer sua história.</p>
      </header>
      <div className={styles.grid}>
        {locations.map((location) => (
          <button
            className={styles.card}
            key={location.key}
            onClick={() => openLocation(location.key)}
            type="button"
          >
            <span aria-hidden="true" className={styles.artwork} style={artworkStyle(location)} />
            <span className={styles.cardCopy}>
              <strong>{location.name}</strong>
              <span>{location.description}</span>
              <small>Ver local ↗</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function RealmLocationModalHost() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const location = realmLocations.find((entry) => entry.key === selectedKey) ?? null;
  const realm = location ? realmLore.find((entry) => entry.key === location.realmKey) : null;

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key) setSelectedKey(customEvent.detail.key);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedKey(null);
    };
    window.addEventListener(locationEvent, handleOpen);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener(locationEvent, handleOpen);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!location) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [location]);

  if (!location) return null;

  return (
    <div
      aria-label={`Fechar detalhes de ${location.name}`}
      className={styles.backdrop}
      onMouseDown={() => setSelectedKey(null)}
      role="presentation"
    >
      <article
        aria-labelledby="realm-location-modal-title"
        aria-modal="true"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        style={{ "--realm": realm?.color ?? "#315f47" } as CSSProperties}
      >
        <button
          aria-label="Fechar"
          autoFocus
          className={styles.close}
          onClick={() => setSelectedKey(null)}
          type="button"
        >
          ×
        </button>
        <div
          className={styles.modalArtwork}
          style={artworkStyle(location)}
          role="img"
          aria-label={location.name}
        />
        <div className={styles.modalCopy}>
          <small>{realm?.name ?? "Wonderland"} · ATLAS DE LOCALIDADES</small>
          <h2 id="realm-location-modal-title">{location.name}</h2>
          <p>{location.description}</p>
          <footer>
            <span style={{ background: realm?.color }} />
            {realm?.epithet}
          </footer>
        </div>
      </article>
    </div>
  );
}
