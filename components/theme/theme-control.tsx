"use client";

import { useEffect, useState } from "react";

type ThemeName = "classic" | "accessible";

const themeStorageKey = "wonderland:theme";

const themes: Array<{
  key: ThemeName;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: "classic",
    label: "Clássico",
    description: "Verde profundo, dourado e efeitos do mundo.",
    icon: "✦",
  },
  {
    key: "accessible",
    label: "Escuro acessível",
    description: "Mais contraste, menos brilho e movimento.",
    icon: "◐",
  },
];

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // A escolha continua válida durante a sessão quando o navegador bloqueia o armazenamento.
  }
}

export function ThemeControl() {
  const [theme, setTheme] = useState<ThemeName>("classic");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(themeStorageKey);
    } catch {
      // O tema clássico continua disponível sem armazenamento local.
    }
    const current: ThemeName = stored === "accessible" ? "accessible" : "classic";
    document.documentElement.dataset.theme = current;
    queueMicrotask(() => setTheme(current));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  function choose(nextTheme: ThemeName) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setOpen(false);
  }

  return (
    <aside className={`theme-control ${open ? "is-open" : ""}`}>
      {open ? (
        <div className="theme-control__menu" role="group" aria-label="Escolha o tema do site">
          <header>
            <span>APARÊNCIA</span>
            <strong>Escolha seu tema</strong>
            <small>A preferência será usada em todas as páginas.</small>
          </header>
          {themes.map((option) => (
            <button
              aria-pressed={theme === option.key}
              className={theme === option.key ? "is-active" : ""}
              key={option.key}
              onClick={() => choose(option.key)}
              type="button"
            >
              <i aria-hidden="true">{option.icon}</i>
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              <b aria-hidden="true">{theme === option.key ? "✓" : ""}</b>
            </button>
          ))}
        </div>
      ) : null}
      <button
        aria-expanded={open}
        aria-label="Escolher tema do site"
        className="theme-control__toggle"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true">{theme === "accessible" ? "◐" : "✦"}</span>
        <small>
          <b>Tema</b>
          <em>{theme === "accessible" ? "Escuro acessível" : "Clássico"}</em>
        </small>
      </button>
    </aside>
  );
}
