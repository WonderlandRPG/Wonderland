"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { musicTrackForPath, musicTracks } from "@/lib/audio/sources";
import styles from "./audio-provider.module.css";

// v2 intentionally resets stale on/off state left by older versions of the player.
// Volume keeps the original key so a player's chosen percentage follows every page.
const enabledKey = "wonderland:music-enabled-v2";
const positionsKey = "wonderland:music-positions-v2";
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
    const stored = window.localStorage.getItem(volumeKey);
    if (stored === null) return defaultVolume;
    const value = Number(stored);
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
    if (!audio || !enabledRef.current || !audio.src) return false;

    try {
      audio.muted = false;
      audio.volume = readVolume();
      await audio.play();
      setPlaybackState("playing");
      return true;
    } catch {
      setPlaybackState(audio.error ? "error" : "blocked");
      return false;
    }
  }, []);

  const enableAndPlay = useCallback(async () => {
    enabledRef.current = true;
    setEnabled(true);
    try {
      window.localStorage.setItem(enabledKey, "true");
    } catch {}
    return play();
  }, [play]);

  useEffect(() => {
    const storedEnabled = readEnabled();
    const storedVolume = readVolume();
    enabledRef.current = storedEnabled;
    setEnabled(storedEnabled);
    setVolume(storedVolume);
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.volume = storedVolume;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const previousTrack = previousTrackRef.current;
    if (previousTrack !== trackKey) savePosition(previousTrack, audio.currentTime || 0);
    previousTrackRef.current = trackKey;

    const fallback = "fallback" in track ? track.fallback : undefined;
    let usingFallback = false;
    let restored = false;

    const restorePosition = () => {
      if (restored) return;
      const savedPosition = readPositions()[trackKey] ?? 0;
      if (savedPosition > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          audio.currentTime = savedPosition % audio.duration;
        } catch {}
      }
      restored = true;
    };

    const tryToPlay = () => {
      restorePosition();
      if (enabledRef.current) void play();
    };

    const useFallback = () => {
      if (usingFallback || !fallback) {
        setPlaybackState("error");
        return;
      }
      usingFallback = true;
      restored = false;
      setPlaybackState("loading");
      audio.pause();
      audio.src = fallback;
      audio.muted = false;
      audio.volume = readVolume();
      audio.load();
    };

    const markPlaying = () => setPlaybackState("playing");
    const markPaused = () => {
      if (enabledRef.current) setPlaybackState("paused");
    };
    const markWaiting = () => setPlaybackState("loading");

    audio.addEventListener("loadedmetadata", restorePosition);
    audio.addEventListener("canplay", tryToPlay);
    audio.addEventListener("error", useFallback);
    audio.addEventListener("playing", markPlaying);
    audio.addEventListener("pause", markPaused);
    audio.addEventListener("waiting", markWaiting);

    restored = false;
    setPlaybackState("loading");
    audio.pause();
    audio.src = track.source;
    audio.muted = false;
    audio.volume = readVolume();
    audio.load();

    return () => {
      savePosition(trackKey, audio.currentTime || 0);
      audio.removeEventListener("loadedmetadata", restorePosition);
      audio.removeEventListener("canplay", tryToPlay);
      audio.removeEventListener("error", useFallback);
      audio.removeEventListener("playing", markPlaying);
      audio.removeEventListener("pause", markPaused);
      audio.removeEventListener("waiting", markWaiting);
    };
  }, [play, savePosition, track, trackKey]);

  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (enabledRef.current && audio?.paused) void play();
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchstart", unlock, true);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };
  }, [play, trackKey]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    const isActuallyPlaying = Boolean(audio && !audio.paused && !audio.ended);

    if (!isActuallyPlaying) {
      void enableAndPlay();
      return;
    }

    enabledRef.current = false;
    setEnabled(false);
    try {
      window.localStorage.setItem(enabledKey, "false");
    } catch {}
    audio?.pause();
    setPlaybackState("paused");
  };

  const changeVolume = (next: number) => {
    const normalized = Math.max(0, Math.min(1, next));
    setVolume(normalized);
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.volume = normalized;
    }
    try {
      window.localStorage.setItem(volumeKey, String(normalized));
    } catch {}
    if (normalized > 0 && audioRef.current?.paused) void enableAndPlay();
  };

  const togglePanel = () => {
    setOpen((value) => !value);
    if (audioRef.current?.paused || !enabledRef.current) void enableAndPlay();
  };

  const stateLabel =
    playbackState === "blocked"
      ? " · clique em ▶ para liberar o áudio"
      : playbackState === "error"
        ? " · não foi possível carregar esta trilha"
        : playbackState === "loading"
          ? " · carregando"
          : "";

  return (
    <>
      {children}
      <audio aria-hidden="true" hidden loop preload="auto" ref={audioRef} />
      <div className={styles.dock}>
        {open ? (
          <div className={styles.panel} role="group" aria-label="Controle de música">
            <span className={styles.label}>
              {track.label}
              {stateLabel}
            </span>
            <button
              aria-label={enabled && playbackState === "playing" ? "Pausar música" : "Tocar música"}
              className={styles.mute}
              onClick={togglePlayback}
              type="button"
            >
              {enabled && playbackState === "playing" ? "Ⅱ" : "▶"}
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
          aria-label="Abrir controle de música e tocar"
          className={styles.toggle}
          data-enabled={enabled}
          onClick={togglePanel}
          title="Música e volume"
          type="button"
        >
          {enabled && playbackState === "playing" ? "♪" : "▶"}
        </button>
      </div>
    </>
  );
}
