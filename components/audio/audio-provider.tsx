"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { musicTrackForPath, musicTracks } from "@/lib/audio/sources";
import styles from "./audio-provider.module.css";

const enabledKey = "wonderland:music-enabled";
const positionsKey = "wonderland:music-positions";
const volumeKey = "wonderland:music-volume";
const defaultVolume = 0.5;

type PlaybackState = "idle" | "loading" | "playing" | "paused" | "blocked" | "error";

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

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const trackKey = musicTrackForPath(pathname);
  const track = musicTracks[trackKey];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(true);
  const previousTrackRef = useRef(trackKey);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(defaultVolume);
  const [open, setOpen] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");

  const savePosition = useCallback((key: string, position: number) => {
    try {
      const positions = readPositions();
      positions[key] = position;
      window.localStorage.setItem(positionsKey, JSON.stringify(positions));
    } catch {}
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabledRef.current) return false;
    try {
      await audio.play();
      setPlaybackState("playing");
      return true;
    } catch {
      setPlaybackState(audio.error ? "error" : "blocked");
      return false;
    }
  }, []);

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

    const previousTrack = previousTrackRef.current;
    if (previousTrack !== trackKey) savePosition(previousTrack, audio.currentTime || 0);
    previousTrackRef.current = trackKey;

    let usingFallback = false;
    let restored = false;

    const restorePosition = () => {
      if (restored) return;
      const savedPosition = readPositions()[trackKey] ?? 0;
      if (savedPosition > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = savedPosition % audio.duration;
      }
      restored = true;
    };

    const tryToPlay = () => {
      restorePosition();
      if (enabledRef.current) void play();
    };

    const useFallback = () => {
      if (usingFallback || !("fallback" in track) || !track.fallback) {
        setPlaybackState("error");
        return;
      }
      usingFallback = true;
      restored = false;
      setPlaybackState("loading");
      audio.pause();
      audio.src = track.fallback;
      audio.volume = readVolume();
      audio.load();
    };

    const markPlaying = () => setPlaybackState("playing");
    const markPaused = () => {
      if (enabledRef.current && playbackState !== "loading") setPlaybackState("paused");
    };

    audio.addEventListener("loadedmetadata", restorePosition);
    audio.addEventListener("canplay", tryToPlay);
    audio.addEventListener("error", useFallback);
    audio.addEventListener("playing", markPlaying);
    audio.addEventListener("pause", markPaused);

    restored = false;
    setPlaybackState("loading");
    audio.pause();
    audio.src = track.source;
    audio.volume = readVolume();
    audio.load();

    return () => {
      savePosition(trackKey, audio.currentTime || 0);
      audio.removeEventListener("loadedmetadata", restorePosition);
      audio.removeEventListener("canplay", tryToPlay);
      audio.removeEventListener("error", useFallback);
      audio.removeEventListener("playing", markPlaying);
      audio.removeEventListener("pause", markPaused);
    };
  }, [play, savePosition, track, trackKey]);

  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (enabledRef.current && audio?.paused) void play();
    };

    // Mantemos os listeners enquanto o site estiver aberto. Se uma primeira
    // tentativa ocorrer cedo demais ou o navegador bloquear autoplay, a próxima
    // interação real do jogador tenta novamente em vez de abandonar o áudio.
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [play, trackKey]);

  const toggleEnabled = () => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    try {
      window.localStorage.setItem(enabledKey, String(next));
    } catch {}
    if (next) void play();
    else {
      audioRef.current?.pause();
      setPlaybackState("paused");
    }
  };

  const changeVolume = (next: number) => {
    const normalized = Math.max(0, Math.min(1, next));
    setVolume(normalized);
    if (audioRef.current) audioRef.current.volume = normalized;
    try {
      window.localStorage.setItem(volumeKey, String(normalized));
    } catch {}
    if (normalized > 0 && enabledRef.current && audioRef.current?.paused) void play();
  };

  const togglePanel = () => {
    setOpen((value) => !value);
    // O clique no controle é uma ação explícita do usuário e, portanto, é a
    // melhor oportunidade para liberar áudio em navegadores com autoplay restrito.
    if (enabledRef.current && audioRef.current?.paused) void play();
  };

  const stateLabel =
    playbackState === "blocked"
      ? " · clique para tocar"
      : playbackState === "error"
        ? " · tentando trilha reserva"
        : "";

  return (
    <>
      {children}
      <audio aria-hidden="true" hidden loop preload="auto" ref={audioRef} />
      <div className={styles.dock}>
        {open ? (
          <div className={styles.panel} role="group" aria-label="Controle de música">
            <span className={styles.label}>{track.label}{stateLabel}</span>
            <button
              aria-label={enabled ? "Pausar música" : "Ativar música"}
              className={styles.mute}
              onClick={toggleEnabled}
              type="button"
            >
              {enabled ? (playbackState === "playing" ? "♫" : "▶") : "×"}
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
          onClick={togglePanel}
          title="Música e volume"
          type="button"
        >
          {enabled ? (playbackState === "playing" ? "♪" : "▶") : "♩"}
        </button>
      </div>
    </>
  );
}
