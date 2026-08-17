"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  musicTrackForPath,
  musicTracks,
  type MusicTrackDefinition,
} from "@/lib/audio/sources";
import styles from "./audio-provider.module.css";

const enabledKey = "wonderland:music-enabled";
const positionsKey = "wonderland:music-positions";
const volumeKey = "wonderland:music-volume";
const defaultVolume = 0.5;

function readEnabled() {
  try {
    return window.localStorage.getItem(enabledKey) !== "false";
  } catch {
    return true;
  }
}

function readVolume() {
  try {
    const value = Number(window.localStorage.getItem(volumeKey));
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : defaultVolume;
  } catch {
    return defaultVolume;
  }
}

function readPositions(): Record<string, number> {
  try {
    return JSON.parse(window.localStorage.getItem(positionsKey) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

async function buildChunkedAudio(parts: readonly string[], mimeType: string) {
  const encoded = (
    await Promise.all(
      parts.map(async (part) => {
        const response = await fetch(part, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Falha ao carregar ${part}`);
        return response.text();
      }),
    )
  )
    .join("")
    .replace(/\s+/g, "");

  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const trackKey = musicTrackForPath(pathname);
  const track = musicTracks[trackKey] as MusicTrackDefinition;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(true);
  const previousTrackRef = useRef(trackKey);
  const objectUrlsRef = useRef<Record<string, string>>({});
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(defaultVolume);
  const [open, setOpen] = useState(false);

  const savePosition = useCallback((key: string, position: number) => {
    try {
      const positions = readPositions();
      positions[key] = position;
      window.localStorage.setItem(positionsKey, JSON.stringify(positions));
    } catch {}
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabledRef.current) return;
    try {
      await audio.play();
    } catch {
      // Navegadores podem exigir a primeira interação. O listener global abaixo libera o áudio.
    }
  }, []);

  const resolveTrackSource = useCallback(
    async (key: string, definition: MusicTrackDefinition) => {
      if (!definition.parts?.length) return definition.source;
      if (objectUrlsRef.current[key]) return objectUrlsRef.current[key];
      try {
        const objectUrl = await buildChunkedAudio(definition.parts, definition.mimeType ?? "audio/mpeg");
        objectUrlsRef.current[key] = objectUrl;
        return objectUrl;
      } catch {
        return definition.fallback ?? definition.source;
      }
    },
    [],
  );

  useEffect(() => {
    const storedEnabled = readEnabled();
    const storedVolume = readVolume();
    enabledRef.current = storedEnabled;
    setEnabled(storedEnabled);
    setVolume(storedVolume);
    if (audioRef.current) audioRef.current.volume = storedVolume;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let cancelled = false;

    const previousTrack = previousTrackRef.current;
    if (previousTrack !== trackKey) savePosition(previousTrack, audio.currentTime || 0);
    previousTrackRef.current = trackKey;
    audio.pause();

    const prepare = async () => {
      const source = await resolveTrackSource(trackKey, track);
      if (cancelled || !source) return;
      audio.src = source;
      audio.volume = readVolume();
      audio.load();

      const restoreAndPlay = () => {
        const savedPosition = readPositions()[trackKey] ?? 0;
        if (savedPosition > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = savedPosition % audio.duration;
        }
        if (enabledRef.current) void play();
      };

      audio.addEventListener("loadedmetadata", restoreAndPlay, { once: true });
    };

    void prepare();
    return () => {
      cancelled = true;
      savePosition(trackKey, audio.currentTime || 0);
    };
  }, [play, resolveTrackSource, savePosition, track, trackKey]);

  useEffect(() => {
    const unlock = () => {
      if (enabledRef.current && audioRef.current?.paused) void play();
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [play, trackKey]);

  useEffect(
    () => () => {
      Object.values(objectUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const toggleEnabled = () => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    try {
      window.localStorage.setItem(enabledKey, String(next));
    } catch {}
    if (next) void play();
    else audioRef.current?.pause();
  };

  const changeVolume = (next: number) => {
    const normalized = Math.max(0, Math.min(1, next));
    setVolume(normalized);
    if (audioRef.current) audioRef.current.volume = normalized;
    try {
      window.localStorage.setItem(volumeKey, String(normalized));
    } catch {}
  };

  return (
    <>
      {children}
      <audio aria-hidden="true" hidden loop preload="metadata" ref={audioRef} />
      <div className={styles.dock}>
        {open ? (
          <div className={styles.panel} role="group" aria-label="Controle de música">
            <span className={styles.label}>{track.label}</span>
            <button
              aria-label={enabled ? "Pausar música" : "Ativar música"}
              className={styles.mute}
              onClick={toggleEnabled}
              type="button"
            >
              {enabled ? "♫" : "×"}
            </button>
            <input
              aria-label="Volume da música"
              className={styles.range}
              max="100"
              min="0"
              onChange={(event) => changeVolume(Number(event.target.value) / 100)}
              type="range"
              value={Math.round(volume * 100)}
            />
            <strong className={styles.value}>{Math.round(volume * 100)}%</strong>
          </div>
        ) : null}
        <button
          aria-expanded={open}
          aria-label="Abrir controle de música"
          className={styles.toggle}
          data-enabled={enabled}
          onClick={() => setOpen((value) => !value)}
          title="Música e volume"
          type="button"
        >
          {enabled ? "♪" : "♩"}
        </button>
      </div>
    </>
  );
}
