"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { musicTrackForPath, musicTracks } from "@/lib/audio/sources";

type AudioStatus = "loading" | "blocked" | "playing" | "paused" | "error";

const enabledKey = "wonderland:music-enabled";
const positionsKey = "wonderland:music-positions";

function readEnabled() {
  try {
    return window.localStorage.getItem(enabledKey) !== "false";
  } catch {
    return true;
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
  const [status, setStatus] = useState<AudioStatus>("loading");

  const savePosition = useCallback((key: string, position: number) => {
    try {
      const positions = readPositions();
      positions[key] = position;
      window.localStorage.setItem(positionsKey, JSON.stringify(positions));
    } catch {
      // A troca de música continua funcionando sem armazenamento local.
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabledRef.current) return;
    try {
      await audio.play();
      setStatus("playing");
    } catch (error) {
      setStatus(
        error instanceof DOMException && error.name === "NotAllowedError" ? "blocked" : "error",
      );
    }
  }, []);

  useEffect(() => {
    const storedEnabled = readEnabled();
    enabledRef.current = storedEnabled;
    queueMicrotask(() => {
      setEnabled(storedEnabled);
      setStatus(storedEnabled ? "loading" : "paused");
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const previousTrack = previousTrackRef.current;
    if (previousTrack !== trackKey) savePosition(previousTrack, audio.currentTime || 0);
    previousTrackRef.current = trackKey;

    audio.pause();
    audio.src = track.source;
    audio.load();
    setStatus(enabledRef.current ? "loading" : "paused");

    const restoreAndPlay = () => {
      const savedPosition = readPositions()[trackKey] ?? 0;
      if (savedPosition > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = savedPosition % audio.duration;
      }
      if (enabledRef.current) void play();
    };

    audio.addEventListener("loadedmetadata", restoreAndPlay, { once: true });
    return () => {
      audio.removeEventListener("loadedmetadata", restoreAndPlay);
      savePosition(trackKey, audio.currentTime || 0);
    };
  }, [play, savePosition, track.source, trackKey]);

  useEffect(() => {
    const unlock = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".audio-control")) return;
      if (enabledRef.current && audioRef.current?.paused) void play();
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [play, trackKey]);

  function toggle() {
    const audio = audioRef.current;
    if (status === "playing" && enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      try {
        window.localStorage.setItem(enabledKey, "false");
      } catch {}
      audio?.pause();
      setStatus("paused");
    } else {
      enabledRef.current = true;
      setEnabled(true);
      try {
        window.localStorage.setItem(enabledKey, "true");
      } catch {}
      setStatus("loading");
      void play();
    }
  }

  return (
    <>
      {children}
      <audio
        aria-hidden="true"
        hidden
        loop
        onError={() => setStatus("error")}
        onPlaying={() => setStatus("playing")}
        preload="auto"
        ref={audioRef}
      />
      <button
        aria-label={enabled ? "Pausar música" : "Ativar música"}
        aria-pressed={status === "playing"}
        className={`audio-control ${status === "playing" ? "is-playing" : ""} ${status === "error" ? "has-error" : ""}`}
        onClick={toggle}
        type="button"
      >
        <span aria-hidden="true">{status === "playing" ? "♫" : "♪"}</span>
        <small>
          <b>{enabled ? track.label : "Música pausada"}</b>
          <em>{status === "blocked" ? "Clique para ativar" : "Trilha dinâmica"}</em>
        </small>
      </button>
    </>
  );
}
