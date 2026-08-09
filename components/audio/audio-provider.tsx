"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundEffect = "open" | "click" | "confirm" | "error" | "close";

const effectSources: Record<SoundEffect, string> = {
  open: "/assets/effects/Abrir%20Menu%20%20ou%20Janela.mp3",
  click: "/assets/effects/Click.mp3",
  confirm: "/assets/effects/Confirmar.mp3",
  error: "/assets/effects/Erro.mp3",
  close: "/assets/effects/Fechar%20Menu%20%20Janela.mp3",
};

const musicEnabledKey = "wonderland:music-enabled";
const musicPositionKey = "wonderland:music-position";

function isSoundEffect(value: unknown): value is SoundEffect {
  return typeof value === "string" && value in effectSources;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const themeRef = useRef<HTMLAudioElement | null>(null);
  const effectsRef = useRef<Partial<Record<SoundEffect, HTMLAudioElement>>>({});
  const playedNotices = useRef(new WeakSet<Element>());
  const [enabled, setEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);

  const playTheme = useCallback(async () => {
    const theme = themeRef.current;
    if (!theme) return;
    try {
      await theme.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, []);

  const playEffect = useCallback((effect: SoundEffect) => {
    const source = effectsRef.current[effect];
    if (!source) return;
    const instance = source.cloneNode() as HTMLAudioElement;
    instance.volume = effect === "click" ? 0.28 : 0.42;
    void instance.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    const theme = new Audio("/assets/music/tema.mp3");
    theme.loop = true;
    theme.preload = "auto";
    theme.volume = 0.25;
    const savedPosition = Number(window.localStorage.getItem(musicPositionKey));
    if (Number.isFinite(savedPosition) && savedPosition > 0) theme.currentTime = savedPosition;
    const savedEnabled = window.localStorage.getItem(musicEnabledKey) !== "false";
    const restorePreference = window.setTimeout(() => setEnabled(savedEnabled), 0);
    themeRef.current = theme;

    (Object.keys(effectSources) as SoundEffect[]).forEach((key) => {
      const audio = new Audio(effectSources[key]);
      audio.preload = "auto";
      effectsRef.current[key] = audio;
    });

    if (savedEnabled)
      void theme
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));

    const unlock = () => {
      if (savedEnabled && theme.paused)
        void theme
          .play()
          .then(() => setPlaying(true))
          .catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });

    const savePosition = window.setInterval(() => {
      if (Number.isFinite(theme.currentTime))
        window.localStorage.setItem(musicPositionKey, String(theme.currentTime));
    }, 1500);

    return () => {
      window.clearInterval(savePosition);
      window.clearTimeout(restorePreference);
      window.localStorage.setItem(musicPositionKey, String(theme.currentTime || 0));
      theme.pause();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      themeRef.current = null;
      effectsRef.current = {};
    };
  }, []);

  function toggleTheme() {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem(musicEnabledKey, String(next));
    if (next) void playTheme();
    else {
      themeRef.current?.pause();
      setPlaying(false);
    }
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
          if (node instanceof Element) {
            playMountedNotices(node);
            if (node.matches("[data-sfx-on-mount]"))
              playMountedNotices(node.parentNode ?? document);
          }
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

  return (
    <>
      {children}
      <button
        aria-label={enabled ? "Pausar música tema" : "Tocar música tema"}
        aria-pressed={enabled}
        className={`audio-control ${playing ? "is-playing" : ""}`}
        onClick={toggleTheme}
        type="button"
      >
        <span aria-hidden="true">{enabled ? "♫" : "♪"}</span>
        <small>
          {enabled ? (playing ? "Tema tocando" : "Som no primeiro clique") : "Tema pausado"}
        </small>
      </button>
    </>
  );
}
