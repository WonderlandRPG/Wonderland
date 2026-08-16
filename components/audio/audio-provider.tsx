"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { musicTrackForPath, musicTracks } from "@/lib/audio/sources";

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

function shouldDeferAudioDownload() {
  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  return (
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const trackKey = musicTrackForPath(pathname);
  const track = musicTracks[trackKey];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(true);
  const previousTrackRef = useRef(trackKey);
  const deferredRef = useRef(false);

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
    } catch {}
  }, []);

  useEffect(() => {
    enabledRef.current = readEnabled();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const previousTrack = previousTrackRef.current;
    if (previousTrack !== trackKey) savePosition(previousTrack, audio.currentTime || 0);
    previousTrackRef.current = trackKey;

    audio.pause();
    if (shouldDeferAudioDownload()) {
      deferredRef.current = true;
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    deferredRef.current = false;
    audio.src = track.source;
    audio.load();

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
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio || !enabledRef.current) return;
      if (deferredRef.current) {
        deferredRef.current = false;
        audio.src = track.source;
        audio.load();
        audio.addEventListener("loadedmetadata", () => void play(), { once: true });
        return;
      }
      if (audio.paused) void play();
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [play, track.source]);

  return (
    <>
      {children}
      <audio aria-hidden="true" hidden loop preload="metadata" ref={audioRef} />
    </>
  );
}
