"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { effectSources, themeSource } from "@/lib/audio/sources";
import type { SoundEffect } from "@/lib/audio/sources";

type ThemeStatus = "loading" | "blocked" | "playing" | "paused" | "error";

const musicEnabledKey = "wonderland:music-enabled";
const musicPositionKey = "wonderland:music-position";

function isSoundEffect(value: unknown): value is SoundEffect {
  return typeof value === "string" && value in effectSources;
}

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storeValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // O áudio continua funcionando mesmo quando o navegador bloqueia o armazenamento local.
  }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const themeRef = useRef<HTMLAudioElement | null>(null);
  const effectsRef = useRef<Partial<Record<SoundEffect, HTMLAudioElement | null>>>({});
  const playedNotices = useRef(new WeakSet<Element>());
  const enabledRef = useRef(true);
  const [enabled, setEnabled] = useState(true);
  const [effectsUnavailable, setEffectsUnavailable] = useState(false);
  const [status, setStatus] = useState<ThemeStatus>("loading");

  const playTheme = useCallback(async () => {
    const theme = themeRef.current;

    if (!theme || !enabledRef.current) return false;

    try {
      await theme.play();
      setStatus("playing");
      return true;
    } catch (error) {
      const blocked = error instanceof DOMException && error.name === "NotAllowedError";
      setStatus(blocked || !theme.error ? "blocked" : "error");
      return false;
    }
  }, []);

  const playEffect = useCallback((effect: SoundEffect) => {
    const source = effectsRef.current[effect];

    if (!source) return;

    const instance = source.cloneNode(true) as HTMLAudioElement;
    instance.currentTime = 0;
    instance.volume = effect === "click" ? 0.55 : 0.65;
    void instance.play().catch(() => {
      if (instance.error) setEffectsUnavailable(true);
    });
  }, []);

  useEffect(() => {
    const theme = themeRef.current;

    if (!theme) return;

    const savedEnabled = readStoredValue(musicEnabledKey) !== "false";
    const savedPosition = Number(readStoredValue(musicPositionKey));
    enabledRef.current = savedEnabled;
    setEnabled(savedEnabled);
    setStatus(savedEnabled ? "loading" : "paused");

    const restorePosition = () => {
      if (!Number.isFinite(savedPosition) || savedPosition <= 0) return;

      try {
        theme.currentTime = Number.isFinite(theme.duration)
          ? savedPosition % theme.duration
          : savedPosition;
      } catch {
        // Alguns navegadores só permitem restaurar a posição depois de mais dados carregarem.
      }
    };

    if (theme.readyState >= HTMLMediaElement.HAVE_METADATA) restorePosition();
    else theme.addEventListener("loadedmetadata", restorePosition, { once: true });

    const autoplay = savedEnabled
      ? window.setTimeout(() => {
          void playTheme();
        }, 0)
      : null;

    const unlock = (event: Event) => {
      const target =
        event.target instanceof Element ? event.target.closest(".audio-control") : null;

      if (!target && enabledRef.current && theme.paused) void playTheme();
    };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);

    const savePosition = window.setInterval(() => {
      if (Number.isFinite(theme.currentTime)) {
        storeValue(musicPositionKey, String(theme.currentTime));
      }
    }, 1500);

    return () => {
      window.clearInterval(savePosition);
      if (autoplay !== null) window.clearTimeout(autoplay);
      storeValue(musicPositionKey, String(theme.currentTime || 0));
      theme.pause();
      theme.removeEventListener("loadedmetadata", restorePosition);
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [playTheme]);

  function toggleTheme() {
    const theme = themeRef.current;

    if (status === "playing" && theme) {
      enabledRef.current = false;
      setEnabled(false);
      storeValue(musicEnabledKey, "false");
      theme.pause();
      setStatus("paused");
      return;
    }

    enabledRef.current = true;
    setEnabled(true);
    storeValue(musicEnabledKey, "true");
    setStatus("loading");
    void playTheme();
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest("button, a, [role='button'], input[type='submit']")
          : null;

      if (!target) return;

      const requested = target.getAttribute("data-sfx");
      playEffect(isSoundEffect(requested) ? requested : "click");
    };

    const handleCustom = (event: Event) => {
      const requested = (event as CustomEvent<unknown>).detail;
      if (isSoundEffect(requested)) playEffect(requested);
    };

    const playMountedNotices = (root: ParentNode) => {
      root.querySelectorAll?.("[data-sfx-on-mount]").forEach((element) => {
        if (playedNotices.current.has(element)) return;
        playedNotices.current.add(element);
        const requested = element.getAttribute("data-sfx-on-mount");
        if (isSoundEffect(requested)) playEffect(requested);
      });
    };

    playMountedNotices(document);

    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("[data-sfx-on-mount]")) playMountedNotices(node.parentNode ?? document);
          playMountedNotices(node);
        }),
      ),
    );

    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleClick, true);
    window.addEventListener("wonderland:sfx", handleCustom);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("wonderland:sfx", handleCustom);
    };
  }, [playEffect]);

  const controlLabel =
    status === "playing"
      ? effectsUnavailable
        ? "Tema tocando · efeitos indisponíveis"
        : "Tema tocando"
      : status === "paused" || !enabled
        ? "Tema pausado"
        : status === "error"
          ? "Áudio indisponível"
          : "Ativar som";

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
        ref={themeRef}
        src={themeSource}
      />
      {(Object.entries(effectSources) as [SoundEffect, string][]).map(([effect, source]) => (
        <audio
          aria-hidden="true"
          hidden
          key={effect}
          onError={() => setEffectsUnavailable(true)}
          preload="auto"
          ref={(element) => {
            effectsRef.current[effect] = element;
          }}
          src={source}
        />
      ))}
      <button
        aria-label={status === "playing" ? "Pausar música tema" : "Ativar música tema"}
        aria-pressed={status === "playing"}
        className={`audio-control ${status === "playing" ? "is-playing" : ""} ${status === "blocked" ? "is-blocked" : ""} ${status === "error" || effectsUnavailable ? "has-error" : ""}`}
        onClick={toggleTheme}
        type="button"
      >
        <span aria-hidden="true">{status === "playing" ? "♫" : "♪"}</span>
        <small>{controlLabel}</small>
      </button>
    </>
  );
}
